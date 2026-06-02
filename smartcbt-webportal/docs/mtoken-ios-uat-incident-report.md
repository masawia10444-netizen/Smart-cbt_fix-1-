# รายงานปัญหา mToken Login บน iOS UAT

## 1. ภาพรวมปัญหา

พบปัญหาผู้ใช้ไม่สามารถเข้าสู่ระบบผ่าน mToken บน iOS UAT ได้ ในขณะที่ Android สามารถใช้งานและ login ได้ตามปกติ

อาการที่พบจากฝั่ง iOS:

- ระบบแสดงข้อความลักษณะ "ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้"
- เมื่อกดเมนู hamburger เพื่อเข้า Login ระบบไม่พาไปหน้า Login
- ระบบแสดงหน้า Landing หรือ Main menu แทน
- mToken login flow ไม่ถูกเรียกใช้งาน

จากการตรวจสอบด้วย vConsole บน iOS พบว่า URL ที่ถูกเปิดเข้ามาคือ:

```txt
/landing?appId=...&mToken=...
```

แต่ logic mToken login ของระบบถูกออกแบบให้เริ่มทำงานที่:

```txt
/login?appId=...&mToken=...
```

## 2. สาเหตุของปัญหา

สาเหตุหลักคือ iOS mToken flow ส่งผู้ใช้เข้ามาที่หน้า `/landing` พร้อม query `appId` และ `mToken` แต่หน้า `/landing` เป็นหน้าแสดงข้อมูลทั่วไป ไม่ได้เรียก logic สำหรับ mToken login

ผลที่เกิดขึ้นคือระบบไม่ได้ทำงานในขั้นตอนสำคัญต่อไปนี้:

- ไม่เรียก `loginWithMToken()`
- ไม่ fetch profile จาก mToken
- ไม่ตรวจสอบว่าผู้ใช้อยู่ในระบบแล้วหรือยัง
- ไม่พาผู้ใช้ใหม่ไปหน้า register แบบ prefill
- ไม่สร้าง session login ให้ผู้ใช้

นอกจากนี้ iOS WebView ยังมี cookie session เก่าค้างอยู่ เช่น:

```txt
NEXT_TOKEN
APP_CODE
MTOKEN_SESSION=true
```

เมื่อผู้ใช้พยายามเข้า `/login` middleware จึงมองว่าผู้ใช้ยังมี session อยู่ และ redirect ไป `/main-menus` แทน ทำให้อาการดูเหมือนกด Login แล้วไม่สามารถเข้าสู่หน้า Login ได้

## 3. แนวทางแก้ไข

### 3.1 แก้ middleware ให้รองรับ mToken จากทุก path

ปรับ middleware ให้ตรวจสอบ request ที่มี `appId` และ `mToken` ไม่ว่าจะเข้ามาจาก path ใด เช่น `/landing`

เมื่อพบว่าเป็น mToken login request ระบบจะ redirect ไปที่:

```txt
/login?appId=...&mToken=...
```

พร้อมล้าง cookie session เก่าก่อน:

```txt
NEXT_TOKEN
NEXT_REFRESH_TOKEN
APP_CODE
MTOKEN_SESSION
```

### 3.2 เพิ่ม fallback ที่หน้า Landing

เพิ่ม logic ฝั่ง client ที่หน้า `/landing` หากพบ query `appId` และ `mToken` ให้ redirect ไป `/login` อีกชั้นหนึ่ง

แนวทางนี้ช่วยป้องกันกรณี client-side navigation หรือ middleware ไม่ได้ intercept request ตั้งแต่ต้น

### 3.3 รองรับชื่อ query หลายรูปแบบ

เพิ่มการรองรับชื่อ parameter หลาย case:

```txt
mToken
MToken
mtoken
```

เพื่อป้องกันปัญหาจาก SDK หรือ native app ส่งชื่อ parameter ไม่ตรงกับที่ระบบคาดไว้

### 3.4 เพิ่ม vConsole สำหรับ debug บน iOS WebView

ติดตั้ง vConsole เพื่อให้ตรวจสอบข้อมูลจากอุปกรณ์จริงได้ เช่น:

- Console log
- Network request
- Cookies
- LocalStorage
- SessionStorage

## 4. ผลลัพธ์หลังแก้ไข

หลัง deploy แล้ว ทดสอบด้วย UAT domain:

```txt
https://smart-dasta-czp-uat.biza.me/landing?appId=test&mToken=test
```

ผลลัพธ์ที่ได้:

```txt
307 Redirect
Location: /login?appId=test&mToken=test
```

และ response มีการล้าง cookie เก่า:

```txt
NEXT_TOKEN=;
NEXT_REFRESH_TOKEN=;
APP_CODE=;
MTOKEN_SESSION=;
```

เมื่อ follow redirect ไป `/login` ได้ผลลัพธ์:

```txt
200 OK
```

จึงยืนยันได้ว่า request จาก `/landing?appId=...&mToken=...` ถูกส่งเข้า mToken login flow ได้ถูกต้องแล้ว

## 5. สถานะ Deploy

Deploy แล้วที่ commit:

```txt
1252f77 fix: route landing mtoken requests to login
```

Container ที่ใช้งาน:

```txt
next-website: Up
```

หลัง build ได้ cleanup server แล้ว:

```txt
Docker build cache: 41.99GB -> 0B
Disk usage: 81% -> 30%
```

## 6. สรุป

ปัญหาไม่ได้เกิดจาก iOS ไม่มีอินเทอร์เน็ตจริง และไม่ได้เกิดจาก Android/iOS login logic ต่างกันโดยตรง

สาเหตุจริงคือ iOS mToken เปิด URL เข้ามาที่ `/landing` ซึ่งไม่ใช่หน้าที่ mToken login flow ทำงาน ประกอบกับมี cookie session เก่าค้าง ทำให้ระบบ redirect ไป `/main-menus` แทนที่จะเข้าสู่ `/login`

หลังแก้ให้ `/landing?appId=...&mToken=...` redirect ไป `/login?appId=...&mToken=...` พร้อมล้าง session เก่า ระบบ mToken login บน iOS UAT สามารถเข้าสู่ flow ได้ถูกต้องแล้ว
