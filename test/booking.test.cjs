const { app } = require("../app.js"); // ✅ Use only `app`, not `server`
const chai = require("chai");
const chaiHttp = require("chai-http");
const mongoose = require("mongoose");
const Booking = require("../model/Booking");
const User = require("../model/user");
const Tutor = require("../model/tutor");
const Student = require("../model/student");

chai.use(chaiHttp);
const { expect } = chai;

describe("Booking API", () => {
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

  it("should create a new booking request", (done) => {
    chai
      .request(app)
      .post("/api/bookings/request")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        tutorId: "67c028f0850e27ee3997187d", // Replace with actual tutor ID
        date: "2025-03-10",
        time: "10:00 AM",
        note: "Need help with math",
      })
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property(
          "message",
          "Booking request created successfully."
        );
        bookingId = res.body.booking._id;
        done();
      });
  });

  it("should accept a booking request", (done) => {
    chai
      .request(app)
      .put(`/api/bookings/accept/${bookingId}`)
      .set("Authorization", `Bearer ${tutorToken}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("message", "Booking accepted.");
        done();
      });
  });


  it("should fetch all student bookings", (done) => {
    chai
      .request(app)
      .get("/api/bookings/student")
      .set("Authorization", `Bearer ${studentToken}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("bookings").that.is.an("array");
        done();
      });
  });

  it("should fetch all tutor bookings", (done) => {
    chai
      .request(app)
      .get("/api/bookings/tutor")
      .set("Authorization", `Bearer ${tutorToken}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("bookings").that.is.an("array");
        done();
      });
  });

});
