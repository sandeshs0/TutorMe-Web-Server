const { app } = require("../app.js"); 
const chai = require("chai");
const chaiHttp = require("chai-http");
const mongoose = require("mongoose");
const Notification = require("../model/Notification");

chai.use(chaiHttp);
const { expect } = chai;

describe("Notification API", () => {
  let userToken;

  before((done) => {
    chai
      .request(app)
      .post("/auth/login")
      .send({
        email: "test1740650291374@example.com",
        password: "Password123",
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        userToken = res.body.token;
        done();
      });
  });

  it("should fetch user notifications", (done) => {
    chai
      .request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${userToken}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an("array");
        done();
      });
  });

  it("should mark notifications as read", (done) => {
    chai
      .request(app)
      .put("/api/notifications/mark-read")
      .set("Authorization", `Bearer ${userToken}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property(
          "message",
          "Notifications marked as read"
        );
        done();
      });
  });
});
