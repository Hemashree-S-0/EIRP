const bcrypt = require("bcryptjs");

const users = [];
const incidents = [];
const comments = [];
const notifications = [];
const auditLogs = [];

function seedDemoData() {
  if (users.length > 0) {
    return;
  }

  const adminPassword = bcrypt.hashSync("Admin@123", 10);
  users.push({
    id: 1,
    fullName: "Dr. Asha Rao",
    email: "admin@eirp.gov",
    role: "admin",
    password: adminPassword,
    department: "Environment Protection"
  });

  users.push({
    id: 2,
    fullName: "Ravi Menon",
    email: "officer@eirp.gov",
    role: "officer",
    password: bcrypt.hashSync("Officer@123", 10),
    department: "Air Quality"
  });

  users.push({
    id: 3,
    fullName: "Meera Thomas",
    email: "citizen@eirp.gov",
    role: "citizen",
    password: bcrypt.hashSync("Citizen@123", 10),
    department: "Public"
  });

  incidents.push({
    id: 1,
    title: "Industrial Waste Leak",
    category: "Water Pollution",
    description: "A chemical spill was reported near the riverbank after a burst storage tank.",
    date: "2026-07-05",
    time: "08:15",
    location: "Rivergate Industrial Zone",
    latitude: 12.9716,
    longitude: 77.5946,
    severity: "high",
    status: "investigating",
    submittedBy: 3,
    assignedTo: 2,
    createdAt: new Date().toISOString()
  });

  incidents.push({
    id: 2,
    title: "Open Burning at Dump Yard",
    category: "Air Pollution",
    description: "Unauthorized burning detected at the local dump yard during evening hours.",
    date: "2026-07-06",
    time: "18:40",
    location: "Malleswaram Dump Yard",
    latitude: 12.995,
    longitude: 77.571,
    severity: "medium",
    status: "resolved",
    submittedBy: 3,
    assignedTo: 2,
    createdAt: new Date().toISOString()
  });

  notifications.push({
    id: 1,
    message: "New incident assigned to your team",
    read: false
  });

  comments.push({
    id: 1,
    incidentId: 1,
    author: "Ravi Menon",
    content: "Site inspection initiated and samples collected.",
    createdAt: new Date().toISOString()
  });

  auditLogs.push({
    id: 1,
    action: "Admin login",
    actor: "Dr. Asha Rao",
    createdAt: new Date().toISOString()
  });
}

seedDemoData();

function getUsers() {
  return users;
}

function getUserByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

function getUserById(id) {
  return users.find((user) => user.id === Number(id));
}

function addUser(user) {
  users.push(user);
  return user;
}

function getIncidents() {
  return incidents;
}

function addIncident(incident) {
  incidents.push(incident);
  return incident;
}

function getIncidentById(id) {
  return incidents.find((incident) => incident.id === Number(id));
}

function getComments(incidentId) {
  return comments.filter((comment) => comment.incidentId === Number(incidentId));
}

function addComment(comment) {
  comments.push(comment);
  return comment;
}

function getNotifications() {
  return notifications;
}

function getAuditLogs() {
  return auditLogs;
}

module.exports = {
  getUsers,
  getUserByEmail,
  getUserById,
  addUser,
  getIncidents,
  addIncident,
  getIncidentById,
  getComments,
  addComment,
  getNotifications,
  getAuditLogs
};
