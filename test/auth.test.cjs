const { app } = require("../app.js"); // ✅ Use only `app`, not `server`
const chai = require("chai");
const chaiHttp = require("chai-http");
const mongoose = require("mongoose");
const User = require("../model/user");
const TempUser = require("../model/tempUser");

chai.use(chaiHttp);
const { expect } = chai;

describe("Auth API", () => {
  let userToken;
  let testEmail = `test${Date.now()}@example.com`;
  let testUsername = `user${Date.now()}`;
  let testPhone = `987654${Math.floor(1000 + Math.random() * 9000)}`; // ✅ Ensure unique phone number
  let otp;
  let tutorEmail = `tutor${Date.now()}@example.com`;

  it("should register a student user", (done) => {
    chai
      .request(app)
      .post("/auth/register")
      .send({
        name: "Test User",
        email: testEmail,
        username: testUsername,
        phone: testPhone,
        password: "Password123",
        role: "student",
      })
      .end((err, res) => {
        console.log("Response body", res.body);
        expect(res).to.have.status(201);
        expect(res.body).to.have.property(
          "message",
          "OTP sent to your email. Please verify to complete registration."
        );
        setTimeout(done, 500);
      });
  });

  it("should register a new tutor user", (done) => {
    let tutorUsername = `tutor${Date.now()}`;
    let tutorPhone = `987655${Math.floor(1000 + Math.random() * 9000)}`;

    chai
      .request(app)
      .post("/auth/register")
      .send({
        name: "Tutor User",
        email: tutorEmail,
        username: tutorUsername,
        phone: tutorPhone,
        password: "Password123",
        role: "tutor",
        bio: "Experienced Math Tutor",
        description: "Teaching high school math for 5 years",
        hourlyRate: 20,
        subjects: ["Mathematics"],
      })
      .end((err, res) => {
        console.log("Tutor Response body", res.body);
        expect(res).to.have.status(201);
        expect(res.body).to.have.property(
          "message",
          "OTP sent to your email. Please verify to complete registration."
        );
        setTimeout(done, 500);
      });
  });

  it("should fetch OTP from TempUser table and verify email", (done) => {
    setTimeout(async () => {
      const tempUser = await TempUser.findOne({ email: testEmail });
      expect(tempUser).to.not.be.null;
      otp = tempUser.otp;
      console.log(" Retrieved OTP from DB:", otp);

      chai
        .request(app)
        .post("/auth/verify-email")
        .send({
          email: testEmail,
          otp: otp,
        })
        .end((err, res) => {
          console.log("OTP Verification Response:", res.body);
          expect(res).to.have.status(200);
          expect(res.body).to.have.property(
            "message",
            "Email verified successfully. Registration complete."
          );
          setTimeout(done, 500);
        });
    }, 500);
  });

  it("should verify tutor's registration", function (done) {
    this.timeout(10000); 

    setTimeout(async () => {
      const tempTutor = await TempUser.findOne({ email: tutorEmail });

      if (!tempTutor) {
        console.error(" Tutor TempUser entry not found in DB!");
        return done(new Error("Tutor TempUser entry not found!"));
      }

      otp = tempTutor.otp;
      console.log("Retrieved Tutor OTP from DB:", otp);

      chai
        .request(app)
        .post("/auth/verify-email")
        .send({
          email: tutorEmail,
          otp: otp,
        })
        .end((err, res) => {
          if (err) {
            console.error("Error in OTP verification:", err);
            return done(err);
          }

          console.log("Tutor OTP Verification Response:", res.body);
          expect(res).to.have.status(200);
          expect(res.body).to.have.property(
            "message",
            "Email verified successfully. Registration complete."
          );
          done();
        });
    }, 1000);
  });

  it("should login a user", (done) => {
    chai
      .request(app)
      .post("/auth/login")
      .set("Content-Type", "application/json")
      .send(
        JSON.stringify({
          email: testEmail,
          password: "Password123",
        })
      )
      .end((err, res) => {
        console.log("Response Status:", res.status);
        console.log(" Response Body:", res.body);

        expect(res).to.have.status(200);
        expect(res.body).to.have.property("token");
        userToken = res.body.token;
        setTimeout(done, 500);
      });
  });
});
