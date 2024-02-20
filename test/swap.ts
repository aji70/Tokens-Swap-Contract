import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Swap Contract", () => {
  async function deploySwapContract() {
    const [owner, account1, account2] = await ethers.getSigners();
    const ZeroAddress = "0x0000000000000000000000000000000000000000";
    const ZeroValue = 0;
    const hundredThousandTokens = 100000000;
    const tenThousandTokens = 10000;
    const oneThousandTokens = 1000;

    const Ajidokwu = await ethers.getContractFactory("Ajidokwu20");
    const ajidokwu = await Ajidokwu.deploy(owner);

    const Sabo = await ethers.getContractFactory("Sabo");
    const sabo = await Sabo.deploy(owner);

    const Swap = await ethers.getContractFactory("Swap");

    const swap = await Swap.deploy(ajidokwu.target, sabo.target, 2, 3);

    await ajidokwu.transfer(swap.target, hundredThousandTokens);
    await sabo.transfer(swap.target, hundredThousandTokens);
    await ajidokwu.transfer(account1.address, hundredThousandTokens);
    await sabo.transfer(account1.address, hundredThousandTokens);
    return {
      owner,
      account1,
      account2,
      ajidokwu,
      sabo,
      swap,
      ZeroAddress,
      tenThousandTokens,
      oneThousandTokens,
      hundredThousandTokens,
      ZeroValue,
    };
  }

  describe("Deployment", () => {
    it("Should set the right owner", async () => {
      const { owner, swap } = await loadFixture(deploySwapContract);

      expect(await swap.connect(owner).owner()).to.eq(owner);
    });
    it("Should fail if the wrong address is passed as owner", async () => {
      const { swap, account1 } = await loadFixture(deploySwapContract);

      expect(await swap.connect(account1).owner()).to.not.eq(account1);
    });
    // it.only("should set the right rates", async () => {
    //   const { swap } = await loadFixture(deploySwapContract);
    //   expect(swap.setRateofAjidokwutoStableCoin(2)).to.not.eq(0);
    // });
  });

  describe("Swap Ajidokwu Tokens to Sabo Tokens", () => {
    it("Should Revert if called by address(0)", async () => {
      const { ZeroAddress, owner } = await loadFixture(deploySwapContract);

      expect(owner.address).to.not.equal(ZeroAddress);
    });

    it("Should fail if the owner tries to swap 0 tokens", async () => {
      const { swap, account1, ZeroValue } = await loadFixture(
        deploySwapContract
      );
      await expect(
        swap.connect(account1).swapAjidokwutoSabo(ZeroValue)
      ).to.be.rejectedWith("not a valid Amount to be swaped");
    });

    it("should fail if owner does not have enough Ajidokwu Token to swap", async () => {
      const { owner, swap, account2, tenThousandTokens } = await loadFixture(
        deploySwapContract
      );
      await expect(
        swap.connect(account2).swapAjidokwutoSabo(tenThousandTokens)
      ).to.be.rejectedWith("Insufficient Funds");
    });

    it("should not fail if owner  have enough Ajidokwu Token to swap", async () => {
      const { ajidokwu, owner, swap, oneThousandTokens } = await loadFixture(
        deploySwapContract
      );
      await ajidokwu.connect(owner).approve(swap.target, oneThousandTokens);
      await expect(swap.connect(owner).swapAjidokwutoSabo(oneThousandTokens))
        .not.to.be.rejected;
    });
    it("should fail if Contract does not have enough Sabo Token Liquidity to swap", async () => {
      const { ajidokwu, sabo } = await loadFixture(deploySwapContract);
      const Swap2 = await ethers.getContractFactory("Swap");
      const [owner, account1, account2, hundredThousandTokens] =
        await ethers.getSigners();

      const swap = await Swap2.deploy(ajidokwu.target, sabo.target, 2, 3);

      await expect(
        swap.connect(owner).swapAjidokwutoSabo(Number(1000000000000000))
      ).to.be.rejectedWith("Not Enough Liquidity for Swap");
    });

    it("Should Swap Ajidokwu Tokens to Sabo Tokens properly", async () => {
      const { swap, ajidokwu, sabo, account1 } = await loadFixture(
        deploySwapContract
      );
      const amountToswap = 10000;

      await ajidokwu.connect(account1).approve(swap.target, amountToswap);
      const balB4 = await sabo.balanceOf(account1.address);
      await swap.connect(account1).swapAjidokwutoSabo(amountToswap);
      const newBal = await sabo.balanceOf(account1.address);
      const newlySwapedToken = await swap.ratioAjidokwutoSabo(amountToswap);

      expect(balB4 + newlySwapedToken).to.eq(newBal);
    });

    it("Should dedeuct users Ajidokwu Balance", async () => {
      const { ajidokwu, owner, swap, account1, sabo, tenThousandTokens } =
        await loadFixture(deploySwapContract);

      await ajidokwu.connect(account1).approve(swap.target, tenThousandTokens);
      const userbalB4 = await ajidokwu.balanceOf(account1.address);
      await swap.connect(account1).swapAjidokwutoSabo(tenThousandTokens);
      const newUserBal = await ajidokwu.balanceOf(account1.address);

      expect(newUserBal).to.eq(userbalB4 - BigInt(tenThousandTokens));
    });

    it("Should Add swapped tokens to users Sabo Balance", async () => {
      const { ajidokwu, owner, swap, account1, sabo, tenThousandTokens } =
        await loadFixture(deploySwapContract);

      await ajidokwu.connect(account1).approve(swap.target, tenThousandTokens);
      const userbalB4 = await sabo.balanceOf(account1.address);
      await swap.connect(account1).swapAjidokwutoSabo(tenThousandTokens);
      const newUserBal = await sabo.balanceOf(account1.address);
      const newlySwappedAjidokwuTokens = await swap.ratioAjidokwutoSabo(
        tenThousandTokens
      );

      expect(newUserBal).to.eq(userbalB4 + newlySwappedAjidokwuTokens);
    });

    it("Should add swapped Ajidokwu tokens to Contract  balance", async () => {
      const { swap, ajidokwu, sabo, account1 } = await loadFixture(
        deploySwapContract
      );
      const amountToswap = 10000;

      await ajidokwu.connect(account1).approve(swap.target, amountToswap);
      const balB4 = await ajidokwu.balanceOf(swap.target);
      await swap.connect(account1).swapAjidokwutoSabo(amountToswap);
      const newBal = await ajidokwu.balanceOf(swap.target);
      const newlySwapedToken = await swap.ratioAjidokwutoSabo(amountToswap);

      expect(newBal).to.eq(balB4 + BigInt(amountToswap));
    });
    it("Should deduct Sabo tokens sent to User from contract balance", async () => {
      const { swap, ajidokwu, sabo, account1 } = await loadFixture(
        deploySwapContract
      );
      const amountToswap = 10000;

      await ajidokwu.connect(account1).approve(swap.target, amountToswap);
      const balB4 = await sabo.balanceOf(swap.target);
      await swap.connect(account1).swapAjidokwutoSabo(amountToswap);
      const newBal = await sabo.balanceOf(swap.target);
      const newlySwapedToken = await swap.ratioAjidokwutoSabo(amountToswap);

      expect(newBal).to.eq(balB4 - BigInt(newlySwapedToken));
    });
  });

  describe("Swap Sabo Tokens To Ajidokwu", () => {
    it("Should Revert if called by address(0)", async () => {
      const { ZeroAddress, owner } = await loadFixture(deploySwapContract);

      expect(owner.address).to.not.equal(ZeroAddress);
    });

    it("Should fail if the owner tries to swap 0 tokens", async () => {
      const { swap, account1, ZeroValue } = await loadFixture(
        deploySwapContract
      );
      await expect(
        swap.connect(account1).swapAjidokwutoSabo(ZeroValue)
      ).to.be.rejectedWith("not a valid Amount to be swaped");
    });
    it("should fail if owner does not have enough Sabo Token to swap", async () => {
      const { owner, swap, account2, tenThousandTokens } = await loadFixture(
        deploySwapContract
      );
      await expect(
        swap.connect(account2).swapSabotoAjidokwu(tenThousandTokens)
      ).to.be.rejectedWith("Insufficient Funds");
    });
    it("should fail if Contract does not have enough Ajidkwu Token Liquidity to swap", async () => {
      const { ajidokwu, sabo } = await loadFixture(deploySwapContract);
      const Swap2 = await ethers.getContractFactory("Swap");
      const [owner, account1, account2, hundredThousandTokens] =
        await ethers.getSigners();

      const swap = await Swap2.deploy(ajidokwu.target, sabo.target, 2, 3);

      await expect(
        swap.connect(owner).swapSabotoAjidokwu(Number(1000000000000000))
      ).to.be.rejectedWith("Not Enough Liquidity for Swap");
    });

    it("should not fail if owner  have enough Sabo Token to swap", async () => {
      const { sabo, owner, swap, oneThousandTokens } = await loadFixture(
        deploySwapContract
      );
      await sabo.connect(owner).approve(swap.target, oneThousandTokens);
      await expect(swap.connect(owner).swapSabotoAjidokwu(oneThousandTokens))
        .not.to.be.rejected;
    });
    it("Should Swap Sabo Tokens to Ajidokwu Tokens properly", async () => {
      const { swap, ajidokwu, sabo, account1 } = await loadFixture(
        deploySwapContract
      );
      const amountToswap = 10000;

      await sabo.connect(account1).approve(swap.target, amountToswap);
      const balB4 = await ajidokwu.balanceOf(account1.address);
      await swap.connect(account1).swapSabotoAjidokwu(amountToswap);
      const newBal = await ajidokwu.balanceOf(account1.address);
      const newlySwapedToken = await swap.ratioSabotoAjidokwu(amountToswap);

      expect(balB4 + newlySwapedToken).to.eq(newBal);
    });
    it("Should dedeuct users Sabo Balance", async () => {
      const { ajidokwu, owner, swap, account1, sabo, tenThousandTokens } =
        await loadFixture(deploySwapContract);

      await sabo.connect(account1).approve(swap.target, tenThousandTokens);
      const userbalB4 = await sabo.balanceOf(account1.address);
      await swap.connect(account1).swapSabotoAjidokwu(tenThousandTokens);
      const newUserBal = await sabo.balanceOf(account1.address);

      expect(newUserBal).to.eq(userbalB4 - BigInt(tenThousandTokens));
    });

    it("Should Add swapped tokens to users Ajidokwu Balance", async () => {
      const { ajidokwu, owner, swap, account1, sabo, tenThousandTokens } =
        await loadFixture(deploySwapContract);

      await sabo.connect(account1).approve(swap.target, tenThousandTokens);
      const userbalB4 = await ajidokwu.balanceOf(account1.address);
      await swap.connect(account1).swapSabotoAjidokwu(tenThousandTokens);
      const newUserBal = await ajidokwu.balanceOf(account1.address);
      const newlySwappedAjidokwuTokens = await swap.ratioSabotoAjidokwu(
        tenThousandTokens
      );

      expect(newUserBal).to.eq(userbalB4 + newlySwappedAjidokwuTokens);
    });
    it("Should add swapped Sabo tokens to Contract  balance", async () => {
      const { swap, ajidokwu, sabo, account1 } = await loadFixture(
        deploySwapContract
      );
      const amountToswap = 10000;

      await sabo.connect(account1).approve(swap.target, amountToswap);
      const balB4 = await sabo.balanceOf(swap.target);
      await swap.connect(account1).swapSabotoAjidokwu(amountToswap);
      const newBal = await sabo.balanceOf(swap.target);
      const newlySwapedToken = await swap.ratioSabotoAjidokwu(amountToswap);

      expect(newBal).to.eq(balB4 + BigInt(amountToswap));
    });
    it("Should deduct Ajidokwu tokens sent to User from contract balance", async () => {
      const { swap, ajidokwu, sabo, account1 } = await loadFixture(
        deploySwapContract
      );
      const amountToswap = 10000;

      await sabo.connect(account1).approve(swap.target, amountToswap);
      const balB4 = await ajidokwu.balanceOf(swap.target);
      await swap.connect(account1).swapSabotoAjidokwu(amountToswap);
      const newBal = await ajidokwu.balanceOf(swap.target);
      const newlySwapedToken = await swap.ratioSabotoAjidokwu(amountToswap);

      expect(newBal).to.eq(balB4 - BigInt(newlySwapedToken));
    });
  });

  describe("Check User  Balance", () => {
    it("return the correct user Sabo balance", async () => {
      const { swap, ajidokwu, sabo, account1 } = await loadFixture(
        deploySwapContract
      );
      const amountToswap = 10000;

      await ajidokwu.connect(account1).approve(swap.target, amountToswap);
      const UserSabobalB4 = await sabo.balanceOf(account1.address);
      await swap.connect(account1).swapAjidokwutoSabo(amountToswap);
      const UserSabonewBal = await sabo.balanceOf(account1.address);
      const newlySwapedToken = await swap.ratioAjidokwutoSabo(amountToswap);

      expect(UserSabobalB4 + newlySwapedToken).to.eq(UserSabonewBal);
    });
    it("return the correct user Ajidokwu balance", async () => {
      const { swap, ajidokwu, sabo, account1 } = await loadFixture(
        deploySwapContract
      );
      const amountToswap = 10000;

      await sabo.connect(account1).approve(swap.target, amountToswap);
      const UserAjidokwubalB4 = await swap.checkAjidokwuTokenBal(
        account1.address
      );
      await swap.connect(account1).swapSabotoAjidokwu(amountToswap);
      const UsernewAjidokwuBal = await swap.checkAjidokwuTokenBal(
        account1.address
      );
      const newlySwapedToken = await swap.ratioSabotoAjidokwu(amountToswap);

      expect(UserAjidokwubalB4 + newlySwapedToken).to.eq(UsernewAjidokwuBal);
    });
  });

  describe("Check Contract Balance", async () => {
    it("Should return correct Contract Sabo balance", async () => {
      const { swap, ajidokwu, sabo, account1 } = await loadFixture(
        deploySwapContract
      );
      const amountToswap = 10000;

      await ajidokwu.connect(account1).approve(swap.target, amountToswap);
      const balB4 = await swap.checkContractSaboTokenBal();
      await swap.connect(account1).swapAjidokwutoSabo(amountToswap);
      const newBal = await swap.checkContractSaboTokenBal();
      const newlySwapedToken = await swap.ratioAjidokwutoSabo(amountToswap);

      expect(newBal).to.eq(balB4 - BigInt(newlySwapedToken));
    });

    it("Should return correct Contract Ajidokwu balance", async () => {
      const { swap, ajidokwu, sabo, account1 } = await loadFixture(
        deploySwapContract
      );
      const amountToswap = 10000;

      await sabo.connect(account1).approve(swap.target, amountToswap);
      const balB4 = await swap.checkContractAjidokwuTokenBal();
      await swap.connect(account1).swapSabotoAjidokwu(amountToswap);
      const newBal = await swap.checkContractAjidokwuTokenBal();
      const newlySwapedToken = await swap.ratioSabotoAjidokwu(amountToswap);

      expect(newBal).to.eq(balB4 - BigInt(newlySwapedToken));
    });
  });

  describe("Swapping Events", () => {
    it("Should emit an event on Swapping Ajidokwu to Sabo", async function () {
      const { swap, ajidokwu, sabo, account1 } = await loadFixture(
        deploySwapContract
      );
      const amountToswap = 10000;

      await ajidokwu.connect(account1).approve(swap.target, amountToswap);
      const newlySwapedToken = await swap.ratioAjidokwutoSabo(amountToswap);
      await expect(swap.connect(account1).swapAjidokwutoSabo(amountToswap))
        .to.emit(swap, "swapedSaboToAjidokwuSuccessful")
        .withArgs(amountToswap, "SABO", "to", newlySwapedToken);
    });

    it("Should emit an event on Swapping Sabo to Ajidokwu", async function () {
      const { swap, ajidokwu, sabo, account1 } = await loadFixture(
        deploySwapContract
      );
      const amountToswap = 10000;

      await sabo.connect(account1).approve(swap.target, amountToswap);
      const newlySwapedToken = await swap.ratioSabotoAjidokwu(amountToswap);
      await expect(swap.connect(account1).swapSabotoAjidokwu(amountToswap))
        .to.emit(swap, "swapedAjidokwuToSaboSuccessful")
        .withArgs(amountToswap, "AJI", "to", newlySwapedToken);
    });
  });

  describe("Check if contract gains 1%", () => {
    it("Should gain 1% in stable coin", async () => {
      const { swap, ajidokwu, sabo, account1 } = await loadFixture(
        deploySwapContract
      );
      const amountToswap = 10000;
      const contractiniAjidokwuBal = await swap.checkContractAjidokwuTokenBal();
      const contractSaboBal0 = await swap.checkContractSaboTokenBal();
      await ajidokwu.connect(account1).approve(swap.target, amountToswap);
      await swap.connect(account1).swapAjidokwutoSabo(amountToswap);
      const newlyASwapedToken = await swap.ratioSabotoAjidokwu(amountToswap);

      await sabo.connect(account1).approve(swap.target, newlyASwapedToken);
      await swap.connect(account1).swapSabotoAjidokwu(newlyASwapedToken);
      const contractAjidokwuBalaft = await swap.checkContractAjidokwuTokenBal();
      const contractSaboBal1 = await swap.checkContractSaboTokenBal();

      const ajidokwuToStablecoin = contractiniAjidokwuBal * BigInt(2);
      const saboToStablecoin = contractSaboBal0 * BigInt(3);

      const TotalInitialBal = ajidokwuToStablecoin + saboToStablecoin;
      console.log(TotalInitialBal, " use this initial");
      const fibalajidokwuToStablecoin = contractAjidokwuBalaft * BigInt(2);
      const fibalSaboToStablecoin = contractSaboBal1 * BigInt(3);

      const TotalFinalBal = fibalajidokwuToStablecoin + fibalSaboToStablecoin;

      expect(TotalFinalBal).to.be.greaterThan(TotalInitialBal);

      console.log(TotalFinalBal, " use this final");
    });
  });

  describe("Set the conversion rate of Ajidokwu to a stable coin properly", () => {
    it("Should Revert if called by address(0)", async () => {
      const { ZeroAddress, owner } = await loadFixture(deploySwapContract);

      expect(owner.address).to.not.equal(ZeroAddress);
    });
    it("only Owner should  able to set the rate ", async () => {
      const { swap, account1 } = await loadFixture(deploySwapContract);
      await expect(
        swap.connect(account1).setRateofAjidokwutoStableCoin(3)
      ).to.be.rejectedWith("You do not have the authorization to set Rate");
    });
    it("should not be able to set the rate to 0", async () => {
      const { swap } = await loadFixture(deploySwapContract);
      await expect(swap.setRateofAjidokwutoStableCoin(0)).to.be.rejectedWith(
        "not a valid Rate"
      );
    });
    it("Should set the rate Properly", async () => {
      const Setrate = 4;
      const { swap } = await loadFixture(deploySwapContract);
      await swap.setRateofAjidokwutoStableCoin(Setrate);
      const rate = await swap.ratioAtoStableToken();
      expect(rate).to.be.eq(Setrate);
    });
  });

  describe("Set the conversion rate of Sabo to a stable coin properly", () => {
    it("Should Revert if called by address(0)", async () => {
      const { ZeroAddress, owner } = await loadFixture(deploySwapContract);

      expect(owner.address).to.not.equal(ZeroAddress);
    });
    it("only Owner should  able to set the rate ", async () => {
      const { swap, account1 } = await loadFixture(deploySwapContract);
      await expect(
        swap.connect(account1).setRateofSabotoStableCoin(3)
      ).to.be.rejectedWith("You do not have the authorization to set Rate");
    });
    it("should not be able to set the rate to 0", async () => {
      const { swap } = await loadFixture(deploySwapContract);
      await expect(swap.setRateofSabotoStableCoin(0)).to.be.rejectedWith(
        "not a valid Rate"
      );
    });
    it("Should set the rate Properly", async () => {
      const Setrate = 3;
      const { swap } = await loadFixture(deploySwapContract);
      await swap.setRateofSabotoStableCoin(Setrate);
      const rate = await swap.ratioBtoStableToken();
      expect(rate).to.be.eq(Setrate);
    });
  });
});
