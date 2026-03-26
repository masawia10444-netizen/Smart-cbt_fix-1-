import fetch from 'node-fetch';

const CMS_URL = 'https://dmc.smartcbt.dasta.or.th';
const ADMIN_TOKEN = 'wRL7ymYaTZUYn5JpKvboFgw_EWyPs4f0';
const EMAIL = 'masa.wia10444@gmail.com';
const MOBILE = '0640640249';

async function check() {
  console.log(`Checking for ${EMAIL} and ${MOBILE}...`);

  // 1. Search in directus_users (System)
  // Note: Standard API query for users
  const usersRes = await fetch(`${CMS_URL}/users?filter[email][_eq]=${EMAIL}&status=archived,active,deleted`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
  });
  const usersData = await usersRes.json();
  console.log('--- Directus Users (System) ---');
  console.log(JSON.stringify(usersData.data, null, 2));

  // 2. Search in users collection (Custom)
  const customUsersRes = await fetch(`${CMS_URL}/items/users?filter[email][_eq]=${EMAIL}`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
  });
  const customUsersData = await customUsersRes.json();
  console.log('\n--- Custom Users Collection (by Email) ---');
  console.log(JSON.stringify(customUsersData.data, null, 2));

  const customUsersMobileRes = await fetch(`${CMS_URL}/items/users?filter[mobile][_eq]=${MOBILE}`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
  });
  const customUsersMobileData = await customUsersMobileRes.json();
  console.log('\n--- Custom Users Collection (by Mobile) ---');
  console.log(JSON.stringify(customUsersMobileData.data, null, 2));
}

check().catch(console.error);
