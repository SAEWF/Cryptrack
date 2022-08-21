import dotenv from 'dotenv';
dotenv.config();
import pinataSDK from '@pinata/sdk';
import Web3 from 'web3';
import fetch from 'node-fetch';
const rpcUrl = "https://testnet-rpc.coinex.net/";
const web3 = new Web3(rpcUrl);
const contract_address = "0xd60eeE192cabd02C36C7bAA8815122B1D2883205";
const public_address = process.env.metamask_public_key;
const private_key = process.env.metamask_private_key;
// console.log(public_address, private_key);
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
    // blockchain call to be written for pushing the node
    let tx = myContract.methods.addTimestamp(hash);
	let signedTx = await signThisTransaction(tx);
	const receipt = await web3.eth.sendTransaction(signedTx);
    return receipt;
}

const pushHash = async (hash, prev_hash) => {
    // blockchain call to be written for pushing the node
    let tx = myContract.methods.updateTimestamp(hash, prev_hash);
	let signedTx = await signThisTransaction(tx);
	const receipt = await web3.eth.sendTransaction(signedTx);
    return receipt;
}

const trackMessage = async (hash) => {
	// blockchain call to be written for pushing the node
	let tx = await myContract.methods.trackAsset(hash).call();

	return tx;
}

const retrieveMessage = async (hash) => {
	try {
		const url = 'https://ipfs.originx.games/ipfs/' + hash;
		console.log(url);
		const result = await fetch(url).then(res => res.json()).catch(err=> console.log(err));

		return result;
	} catch(err)  {
		console.log(err);
	}
}


const pinJSONToIPFS = async (res, metadata) => {
    try {
        console.log(metadata);
        const {msg, user, time} = metadata;
        if (!time || !msg || !user) {
            throw new Error('Please provide all and valid details!');
        }

        const auth = await pinata.testAuthentication();
        const options = {
            pinataMetadata: {
                name: user.toString() + '---' + time.toString(),
                keyvalues: {
                    user: 'v0' + user.toString(),
                },
            },
            pinataOptions: {
                cidVersion: 1,
            },
        };

        console.log(options);

        const result = await pinata.pinJSONToIPFS({ ...metadata }, options);
        console.log(result);
        if (!result.IpfsHash || !result.PinSize) {
            throw new Error('IpfsHash or PinSize not defined');
        }
        return result.IpfsHash;
        // res.status(200).json({ status: true, msg: 'pinned successfully', hash: result.IpfsHash, result });
    } catch (err) {
        console.log(err);   
    }
};

export const handleSend = async (req, res) => { 
    let { msg, user, time } = req.body;
    if (!time) time = new Date().getTime();

    const hash = await pinJSONToIPFS(res, { msg, user, time });
    
    await addHash(hash);

    res.status(200).json({ status: true, msg: 'pinned successfully', hash });

}

export const handleForward = async (req, res) => { 
    const { msg, user, time, prev_user, prev_time } = req.body;
    let prev_hash = await pinJSONToIPFS(res, { msg, user: prev_user, time: prev_time });
    console.log('previous hash', prev_hash);

    let hash = await pinJSONToIPFS(res, { msg, user, time });
    console.log('hash', hash);

    const resp = await pushHash(hash, prev_hash);

    res.status(200).json({prev_hash, hash, resp});
}

export const handleTrack = async (req, res) => {
    try {
        let { msg, user, time } = req.body;
        if (!time) time = new Date().getTime();

        let hash = await pinJSONToIPFS(res, { msg, user, time });

        const hashes = await trackMessage(hash);
        let result = hashes.map(async (ipfsHash) => {
            console.log('ipfsHash', ipfsHash);
            const res = await retrieveMessage(ipfsHash);
            // resp.push({...res, hash: ipfsHash});
            return res;
        })
        result = await Promise.all(result);
        res.status(200).json(result);
    } catch (err) {
        console.log(err);
        res.json(err);
    }
}
