const base = 'http://localhost:5000';

async function main() {
  const loginRes = await fetch(base + '/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@gmail.com', password: 'admin@1121' })
  });

  const login = await loginRes.json();
  const token = login.token;

  const fd = new FormData();
  fd.append('serviceType', 'NEW_ID_CARD');
  fd.append('firstName', 'Abebe');
  fd.append('middleName', 'Bekele');
  fd.append('lastName', 'Kebede');
  fd.append('gender', 'Male');
  fd.append('dateOfBirth', '1995-01-15');
  fd.append('placeOfBirth', 'Addis Ababa');
  fd.append('phoneNumber', '0911223344');
  fd.append('nationalId', '1234567890');
  fd.append('email', '');
  fd.append('fullName', 'Abebe Bekele Kebede');

  const res = await fetch(base + '/api/services/submit-application', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: fd
  });

  const text = await res.text();
  console.log(JSON.stringify({ status: res.status, body: text }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
