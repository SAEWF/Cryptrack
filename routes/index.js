const pinataSDK = require('@pinata/sdk');
const Web3 = require('web3');
const rpcUrl = "https://testnet-rpc.coinex.net/";
const web3 = new Web3(rpcUrl);
const axios = require('axios').default;
const contract_address = "0xd60eeE192cabd02C36C7bAA8815122B1D2883205";
const public_address = process.env.metamask_public_key;
const private_key = process.env.metamask_private_key;
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
const pinataApiKey = process.env.pinata_api_key;
const pinataSecretApiKey = process.env.pinata_secret_api_key;

const pinata = pinataSDK(pinataApiKey, pinataSecretApiKey);

const getPreviousHash = async (hash) => { 
    // blockchain call to be written for getting the next node
    const prev = await myContract.methods.getPrevHash(hash).call();

    return prev;
}

const addHash = async (hash) => {
	try {
		// blockchain call to be written for pushing the node
		let tx = myContract.methods.addTimestamp(hash);
		let signedTx = await signThisTransaction(tx);
		const receipt = await web3.eth.sendTransaction(signedTx);
		return receipt;
	} catch (err) {
		console.log(err);
		throw new Error(err)
	}
}

const pushHash = async (hash, prev_hash) => {
	try {
		// blockchain call to be written for pushing the node
		let tx = myContract.methods.updateTimestamp(hash, prev_hash);
		let signedTx = await signThisTransaction(tx);
		const receipt = await web3.eth.sendTransaction(signedTx);
		return receipt;
	} catch (err) {
		console.log(err);
		throw new Error(err)
	}
}

const trackMessage = async (hash) => {
	try {
		// blockchain call to be written for pushing the node
		let tx = await myContract.methods.trackAsset(hash).call();

		return tx;
	} catch (err) {
		console.log(err);
		throw new Error(err);
	}
}

const retrieveMessage = async (hash) => {
	try {
		const url = 'https://ipfs.originx.games/ipfs/' + hash;
		// console.log(url);
		const result = await axios.get(url);

		return result.data;
	} catch(err)  {
		console.log(err);
		throw new Error(err)
	}
}


const pinJSONToIPFS = async (res, metadata) => {
    try {
        // console.log(metadata);
        const {msg, sender, receiver, time, username} = metadata;
        if (!time || !msg || !sender || !receiver || !username) {
            throw new Error('Please provide all and valid details!');
        }

        const auth = await pinata.testAuthentication();
        const options = {
            pinataMetadata: {
                name: sender.toString() + '---' + time.toString(),
                keyvalues: {
                    sender: 'v0' + sender.toString(),
                },
            },
            pinataOptions: {
                cidVersion: 1,
            },
        };

        // console.log(options);

        const result = await pinata.pinJSONToIPFS({ ...metadata }, options);
        // console.log(result);
        if (!result.IpfsHash || !result.PinSize) {
            throw new Error('IpfsHash or PinSize not defined');
        }
        return result.IpfsHash;
        // res.status(200).json({ status: true, msg: 'pinned successfully', hash: result.IpfsHash, result });
    } catch (err) {
		console.log(err);   
		throw new Error(err);
    }
};

const handleSend = async (req, res) => { 
	try {
		let { msg, sender, receiver, time, forwarded, prev_sender, prev_time } = req.body;
		console.log(req.body);
		let headers = req.headers;

		const client = headers.username;

		let prev_hash, hash;
		if (forwarded) {
			prev_hash = await pinJSONToIPFS(res, { msg, sender: prev_sender, receiver: sender, time: prev_time.toString(), username: client });
			// console.log('previous hash', prev_hash);
		}
			
		if (!time) time = new Date().getTime();

		hash = await pinJSONToIPFS(res, { msg, sender, receiver, time: time.toString(), username: client });
		console.log('hash', hash, 'prev_hash', prev_hash);
		if (prev_hash) 
			await pushHash(hash, prev_hash)
		else
			await addHash(hash);

		res.status(200).json({ status: true, msg: 'pinned successfully', hash, prev_hash });
	} catch (err) {
		console.log(err);
		return res.status(403).json(err);
	}
}

// const handleForward = async (req, res) => { 
// 	try {
// 		const { msg, user, time, prev_user, prev_time } = req.body;
// 		let prev_hash = await pinJSONToIPFS(res, { msg, user: prev_user, time: prev_time });
// 		console.log('previous hash', prev_hash);

// 		let hash = await pinJSONToIPFS(res, { msg, user, time });
// 		console.log('hash', hash);

// 		const resp = await pushHash(hash, prev_hash);

// 		res.status(200).json({ prev_hash, hash, resp });
// 	} catch (err) {
// 		console.log(err);
// 		return res.status(403).json(err);
// 	}
// }

const handleTrack = async (req, res) => {
	try {
		let { msg, sender, receiver, time } = req.body;
		if (!time) time = new Date().getTime();

		const client = req.headers.username;

		let hash = await pinJSONToIPFS(res, { msg, sender, receiver, time: time.toString(), username: client });
		console.log(hash);
		const hashes = await trackMessage(hash);
		let resp = [];
		// process each ipfsHash and get data from pinata
		for (let i = 0; i < hashes.length; i++) {
			const ipfsHash = hashes[i];
			// console.log('ipfsHash', ipfsHash);
			const result = await retrieveMessage(ipfsHash);
			resp.push(result);
		}
		resp.reverse();
		res.status(200).json(resp);
	} catch (err) {
		console.log(err.message);
		return res.status(403).json(err);
	}
}

module.exports = {
	handleSend,
	// handleForward,
	handleTrack
}