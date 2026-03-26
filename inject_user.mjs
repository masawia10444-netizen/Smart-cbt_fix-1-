import fetch from 'node-fetch';

const CMS_URL = 'https://dmc.smartcbt.dasta.or.th';
const ADMIN_TOKEN = 'wRL7ymYaTZUYn5JpKvboFgw_EWyPs4f0';
const USER_ROLE_ID = '4b43c161-6002-406b-879c-944afaf75988';

const USER_DATA = {
  email: 'masa.wia10444@gmail.com',
  firstName: 'เมษา',
  lastName: 'เวียนวงค์',
  mobile: '0640640249',
  password: 'Password123!', // You should change this or let them set it
};

async function inject() {
  console.log('Injecting user...');

  // 1. Create Directus User
  const userRes = await fetch(`${CMS_URL}/users`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: USER_DATA.email,
      password: USER_DATA.password,
      first_name: USER_DATA.firstName,
      last_name: USER_DATA.lastName,
      role: USER_ROLE_ID,
      status: 'active'
    })
  });
  
  const userData = await userRes.json();
  if (!userRes.ok) {
    console.error('Failed to create system user:', userData);
    return;
  }
  const directusId = userData.data.id;
  console.log('Created Directus User ID:', directusId);

  // 2. Create Custom User Profile
  const profileRes = await fetch(`${CMS_URL}/items/users`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: USER_DATA.email,
      firstname: USER_DATA.firstName,
      lastname: USER_DATA.lastName,
      mobile: USER_DATA.mobile,
      directus_user: directusId,
      status: 'published'
    })
  });

  const profileData = await profileRes.json();
  if (!profileRes.ok) {
    console.error('Failed to create custom profile:', profileData);
  } else {
    console.log('Successfully injected user profile!');
  }
}

inject().catch(console.error);
