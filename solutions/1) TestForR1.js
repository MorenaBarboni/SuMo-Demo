const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CampusCoin", function () {
  let campusCoin;
  let admin, university, student;

  /** GLOBAL TEST SETUP: Deply CampusCoin and get test EOAs */
  before(async () => {
    [admin, university, student] = await ethers.getSigners();

    const CampusCoin = await ethers.getContractFactory("CampusCoin");
    campusCoin = await CampusCoin.deploy(university.address);    
  });

  /** TEST SUITE: Test Cases for ERC-20 functionalities */
  describe("Custom ERC-20", () => {

    //LOCAL TEST SETUP: Register a student in the contract
    before(async () => {
      await campusCoin.addStudent(student.address);
    });

     // TEST CASE: Test Cases for ERC-20 functionalities
    it("Should mint tokens to a student", async () => {
      await campusCoin.mint(student.address, "100");
      const balance = await campusCoin.balanceOf(student.address);
      expect(balance).to.equal((100 * UNIT).toString());
    });
  });

});
