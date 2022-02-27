const hre = require('hardhat');

async function main() {
    await hre.run('compile');
    const GNFTMarket = await hre.ethers.getContractFactory('GNFTMarket');
    const market = await GNFTMarket.deploy();
    await market.deployed();
    const { address } = market;
    console.log(`GNFTMarket deployed to: ${address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
