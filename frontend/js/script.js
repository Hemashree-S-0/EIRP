document
.getElementById("incidentForm")
.addEventListener("submit", async (e) => {

e.preventDefault();

const data = {

title:
document.getElementById("title").value,

category:
document.getElementById("category").value,

description:
document.getElementById("description").value,

location:
document.getElementById("location").value,

severity:
document.getElementById("severity").value

};

try {

const response = await fetch(
"http://localhost:3000/api/report",
{
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify(data)
}
);

const result = await response.json();

alert(result.message);

document.getElementById("incidentForm").reset();

}
catch(error) {

alert("Error submitting report");

console.log(error);

}

});