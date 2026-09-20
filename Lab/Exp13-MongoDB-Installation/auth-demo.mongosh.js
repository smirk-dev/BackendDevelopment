use admin;
db.createUser({
  user: "adminUser",
  pwd: "securePassword123",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
});
db.getUser("adminUser")
