const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CampusCoin", function () {
  let campusCoin;
  let admin, university, student1, student2, provider;

  before(async () => {
    [admin, university, student1, student2, provider] = await ethers.getSigners();
    const CampusCoin = await ethers.getContractFactory("CampusCoin");
    campusCoin = await CampusCoin.deploy(university.address);
    await campusCoin.waitForDeployment();
  });

  describe("Deployment", () => {

    it("Should set correct token name and symbol", async () => {
      expect(await campusCoin.name()).to.equal("CampusCoin");
      expect(await campusCoin.symbol()).to.equal("CC");
    });

    it("Should assign the total supply of tokens to the admin", async function () {
      const adminBalance = await campusCoin.balanceOf(admin.address);
      expect(await campusCoin.totalSupply()).to.equal(adminBalance);
    });

    it("Should set university and admin correctly", async () => {
      expect(await campusCoin.university()).to.equal(university.address);
      expect(await campusCoin.admin()).to.equal(admin.address);
    });
  });

  describe("Custom ERC-20", () => {
    before(async () => {
      await campusCoin.addStudent(student1.address);
      await campusCoin.addStudent(student2.address);
    });

    it("Should mint tokens to student", async () => {
      await campusCoin.mint(student1.address, "100");
      const balance = await campusCoin.balanceOf(student1.address);
      expect(balance).to.equal(ethers.parseUnits("100", 18));
    });

    it("Should not mint tokens to non-student", async () => {
      await expect(
        campusCoin.connect(student1).mint(student2.address, "1")
      ).to.be.revertedWith("Only admin can call this");
    });

    it("Should not mint tokens from non-admin", async () => {
      await expect(
        campusCoin.mint(provider.address, "50")
      ).to.be.revertedWith("Can only mint to registered students");
    });

    it("Should burn tokens", async () => {
      await campusCoin.connect(student1).burn("50");
      const balance = await campusCoin.balanceOf(student1.address);
      expect(balance).to.equal(ethers.parseUnits("50", 18));
    });

    it("Should transfer between students", async () => {
      await campusCoin.connect(student1).transfer(student2.address, "10");
      const balance = await campusCoin.balanceOf(student2.address);
      expect(balance).to.equal(ethers.parseUnits("10", 18));
    });

    it("Should not transfer to non-student", async () => {
      await expect(
        campusCoin.connect(student1).transfer(provider.address, "10")
      ).to.be.revertedWith("Recipient must be a registered student");
    });
  });

  describe("Student management", () => {

    it("Should add and remove student", async () => {
      await campusCoin.addStudent(student1.address);
      expect(await campusCoin.isStudent(student1.address)).to.be.true;

      await campusCoin.removeStudent(student1.address);
      expect(await campusCoin.isStudent(student1.address)).to.be.false;
    });

    it("Should only allow admin to manage students", async () => {
      await expect(
        campusCoin.connect(student1).addStudent(student1.address)
      ).to.be.revertedWith("Only admin can call this");

      await expect(
        campusCoin.connect(student1).removeStudent(student1.address)
      ).to.be.revertedWith("Only admin can call this");
    });
  });


  describe("Service Provider management", () => {

    it("Should add and remove provider", async () => {
      await campusCoin.addServiceProvider(provider.address, "Coffee Shop", "Food");
      const sp = await campusCoin.serviceProviders(provider.address);
      expect(sp.name).to.equal("Coffee Shop");
      expect(sp.category).to.equal("Food");
      expect(sp.active).to.be.true;

      await campusCoin.removeServiceProvider(provider.address);
      const updated = await campusCoin.serviceProviders(provider.address);
      expect(updated.active).to.be.false;
    });

    it("Should not add or remove provider from non-admin", async () => {
      await expect(
        campusCoin.connect(student1).addServiceProvider(provider.address, "Coffee Shop", "Food")
      ).to.be.revertedWith("Only admin can call this");

      await expect(
        campusCoin.connect(student1).removeServiceProvider(provider.address)
      ).to.be.revertedWith("Only admin can call this");
    });


    it("Should update provider", async () => {
      await campusCoin.addServiceProvider(provider.address, "Cafe", "Food");
      await campusCoin.updateServiceProvider(provider.address, "Bookstore", "Retail", true);
      const updated = await campusCoin.serviceProviders(provider.address);
      expect(updated.name).to.equal("Bookstore");
      expect(updated.category).to.equal("Retail");
      expect(updated.active).to.be.true;
    });

    it("Should not update non-existing provider", async () => {
      await expect(
        campusCoin.updateServiceProvider(student1.address, "New", "Cat", true)
      ).to.be.revertedWith("Provider not found");
    });

    it("Should not update provider from non-admin", async () => {
      await expect(
        campusCoin.connect(student1).updateServiceProvider(student1.address, "New", "Cat", true)
      ).to.be.revertedWith("Only admin can call this");
    });
  });

  describe("Service Payments", () => {
    before(async () => {
      await campusCoin.addStudent(student1.address);
      await campusCoin.mint(student1.address, "100");
      await campusCoin.addServiceProvider(provider.address, "Gym", "Fitness");
    });

    /**
     * ---------------------------------------------------------
     * This test is badly designed!
     * ---------------------------------------------------------
     * It expects the service provider to receive the full payment amount.
     * The university fee is neither computed nor deducted from the payment.
     */
    it("Should pay service", async () => {
      const amount = "1";
      await campusCoin.connect(student1).payService(provider.address, amount);

      const providerBalance = await campusCoin.balanceOf(provider.address);
      const studentSpent = await campusCoin.totalSpent(student1.address);

      expect(providerBalance).to.equal(ethers.parseUnits(amount, 18));
      expect(studentSpent).to.equal(ethers.parseUnits(amount, 18));
    });

    it("Should fail if payment sender is not a student", async () => {
      await expect(
        campusCoin.connect(provider).payService(provider.address, "10")
      ).to.be.revertedWith("Only registered students can pay");
    });

    it("Should fail if provider is not active", async () => {
      await campusCoin.removeServiceProvider(provider.address);
      await expect(
        campusCoin.connect(student1).payService(provider.address, "10")
      ).to.be.revertedWith("Recipient must be an active service provider");
    });
  });
});