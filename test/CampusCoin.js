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

  /**
   * @test "Should mint tokens to a student"
   *
   * This test verifies the correct behavior of the `mint` function
   * in the CampusCoin contract.
   *
   * Steps:
   * 1. Calls the `mint` function to mint 100 tokens to the student's address.
   * 2. Retrieves the student's token balance using `balanceOf`.
   * 3. Asserts that the balance is equal to 100 * 10^18 (accounting for 18 decimals),
   *    which matches the ERC-20 token standard format.
   *
   * Purpose:
   * Ensures that token minting works correctly and that the recipient
   * receives the correct amount of tokens in base units (wei).
   */
    it("Should mint tokens to a student", async () => {
      await campusCoin.mint(student.address, "100");
      const balance = await campusCoin.balanceOf(student.address);
      expect(balance).to.equal(ethers.parseUnits("100", 18));
    });
  });
});
