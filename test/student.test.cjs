const { app } = require("../app.js"); 
const chai = require("chai");
const chaiHttp = require("chai-http");
const mongoose = require("mongoose");
const Student = require("../model/student");
const User = require("../model/user");

chai.use(chaiHttp);
const { expect } = chai;

describe("Student API", () => {
  let studentToken;

  before((done) => {
    chai
      .request(app)
      .post("/auth/login")
      .set("Content-Type", "application/json")
      .send({
        email: "test1740646631122@example.com",
        password: "Password123",
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("token");
        studentToken = res.body.token;
        done();
      });
  });

  it("should fetch student profile", (done) => {
    chai
      .request(app)
      .get("/api/student/profile")
      .set("Authorization", `Bearer ${studentToken}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("student");
        expect(res.body.student).to.have.property("email");
        expect(res.body.student).to.have.property("name");
        done();
      });
  });

  it("should update student profile", (done) => {
    chai
      .request(app)
      .put("/api/student/profile")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        name: "Updated Student Name",
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property(
          "message",
          "Profile updated successfully"
        );
        done();
      });
  });
});
