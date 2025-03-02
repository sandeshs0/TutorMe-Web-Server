const { app } = require("../app.js"); 
const chai = require("chai");
const chaiHttp = require("chai-http");
const mongoose = require("mongoose");
const Session = require("../model/Session");
const Tutor = require("../model/tutor");
const Student = require("../model/student");

chai.use(chaiHttp);
const { expect } = chai;

describe("Session API", () => {
  let studentToken, tutorToken, bookingId;

  before((done) => {
    // Login as student
    chai
      .request(app)
      .post("/auth/login")
      .send({
        email: "test1740650291374@example.com",
        password: "Password123",
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        studentToken = res.body.token;

        // Login as tutor
        chai
          .request(app)
          .post("/auth/login")
          .send({
            email: "tutor1740646631122@example.com",
            password: "Password123",
          })
          .end((err, res) => {
            expect(res).to.have.status(200);
            tutorToken = res.body.token;
            done();
          });
      });
  });


  it("should fetch student sessions", (done) => {
    chai
      .request(app)
      .get("/api/sessions/student")
      .set("Authorization", `Bearer ${studentToken}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("sessions").that.is.an("array");
        done();
      });
  });

  it("should fetch tutor sessions", (done) => {
    chai
      .request(app)
      .get("/api/sessions/tutor")
      .set("Authorization", `Bearer ${tutorToken}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("sessions").that.is.an("array");
        done();
      });
  });
});
