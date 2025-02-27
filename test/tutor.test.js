const { app } = require("../app.js"); // ✅ Use only `app`, not `server`
const chai = require("chai");
const chaiHttp = require("chai-http");
const mongoose = require("mongoose");
const Tutor = require("../model/tutor");
const User = require("../model/user");

chai.use(chaiHttp);
const { expect } = chai;

describe("Tutor API", () => {
  let tutorToken;
  let tutorUsername = "tutor1740646635116";

  before((done) => {
    chai
      .request(app)
      .post("/auth/login")
      .set("Content-Type", "application/json")
      .send({
        email: "tutor1740646631122@example.com",
        password: "Password123",
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("token");
        tutorToken = res.body.token;
        done();
      });
  });

  it("should fetch all tutors", (done) => {
    chai
      .request(app)
      .get("/api/tutors")
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("tutors").that.is.an("array");
        done();
      });
  });

  it("should update tutor profile", (done) => {
    chai
      .request(app)
      .put("/api/tutors/update-profile")
      .set("Authorization", `Bearer ${tutorToken}`)
      .send({
        bio: "Updated Bio",
        description: "Updated Description",
        hourlyRate: 30,
        subjects: ["Physics"],
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

  it("should fetch tutor profile by username", (done) => {
    console.log("hitting fetch by username by :", tutorUsername);
    chai
      .request(app)
      .get(`/api/tutors/profile/${tutorUsername}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("tutor");
        // expect(res.body.tutor).to.have.property("username", tutorUsername);
        done();
      });
  });
});