const Web3 = require('web3');
const rpcUrl = "https://testnet-rpc.coinex.net/";
const web3 = new Web3(rpcUrl);
const contract_address = "0xd60eeE192cabd02C36C7bAA8815122B1D2883205";
const public_address = 'wallet address';
const private_key = 'same wallet address private key';
const abi = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "ipfsHash",
				"type": "string"
			}
		],
		"name": "addTimestamp",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "newIpfsHash",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "prevIpfsHash",
				"type": "string"
			}
		],
		"name": "updateTimestamp",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "s",
				"type": "string"
			}
		],
		"name": "getPrevHash",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "ipfsHash",
				"type": "string"
			}
		],
		"name": "trackAsset",
		"outputs": [
			{
				"internalType": "string[]",
				"name": "",
				"type": "string[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]
const myContract = new web3.eth.Contract(
    abi,
    contract_address
  );
web3.eth.accounts.wallet.add(private_key);

async function signThisTransaction(tx)
{
	const gas = await tx.estimateGas({from: public_address});
	const gasPrice = await web3.eth.getGasPrice();
	const data = tx.encodeABI();
	const nonce = await web3.eth.getTransactionCount(public_address);
	const txData = {
		from: public_address,
		to: myContract.options.address,
		data: data,
		gas,
		gasPrice,
		nonce 
	};
	return txData;
}

async function todo()
{
	console.log(`Old data value: ${await myContract.methods.getPrevHash('e').call()}`);

	let tx = myContract.methods.updateTimestamp('e', 'd');
	let signedTx = await signThisTransaction(tx);
	const receipt = await web3.eth.sendTransaction(signedTx);
	console.log(`Transaction hash: ${receipt.transactionHash}`);

	console.log(`New data value: ${await myContract.methods.getPrevHash('e').call()}`);

}
todo();