const { app } = require("../app.js");
const chai = require("chai");
const chaiHttp = require("chai-http");
const mongoose = require("mongoose");
const Subject = require("../model/subject");

chai.use(chaiHttp);
const { expect } = chai;

describe("Subject API", () => {
  it("should fetch all subjects", (done) => {
    chai
      .request(app)
      .get("/api/subjects/getAll")
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an("array");
        done();
      });
  });
});