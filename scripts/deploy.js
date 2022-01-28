const hre = require('hardhat');

async function main() {
  await hre.run('compile');
  const GNFT = await hre.ethers.getContractFactory('GNFT');
  const gnft = await GNFT.deploy();
  await gnft.deployed();
  const { address } = gnft;
  console.log(`GNFT deployed to: ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
