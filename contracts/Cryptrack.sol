// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Cryptrack {
    mapping(string => string) prevHash;

    function addTimestamp(string memory ipfsHash) public {
        // checking whether hash is already stored or not
        require(
            keccak256(bytes(prevHash[ipfsHash])) == keccak256(bytes("")),
            "Hash already added"
        );

        // adding the first time stamp (it's prev will be "" empty string)
        prevHash[ipfsHash] = "-1";
    }

    function updateTimestamp(
        string memory newIpfsHash,
        string memory prevIpfsHash
    ) public {
        // checking whether previous hash is already stored or not
        require(
            keccak256(bytes(prevHash[prevIpfsHash])) != keccak256(bytes("")),
            "Previous hash is not present"
        );
        // if(keccak256(bytes(prevHash[prevIpfsHash])) != keccak256(bytes("")))
        //     addTimestamp(prevIpfsHash);

        // update the timestamp
        prevHash[newIpfsHash] = prevIpfsHash;
    }

    function trackAsset(string memory ipfsHash)
        public
        view
        returns (string[] memory)
    {
        // checking whether previous hash is already stored or not
        require(
            keccak256(bytes(prevHash[ipfsHash])) != keccak256(bytes("")),
            "Previous hash is not present"
        );

        uint256 cnt = 1;
        string memory ipfsHash_ = ipfsHash;

        while (keccak256(bytes(prevHash[ipfsHash])) != keccak256(bytes("-1"))) {
            cnt++;
            ipfsHash = prevHash[ipfsHash];
        }
        ipfsHash = ipfsHash_;

        string[] memory allRecords = new string[](cnt);
        uint256 i = 0;
        allRecords[i] = ipfsHash;
        i++;
        while (keccak256(bytes(prevHash[ipfsHash])) != keccak256(bytes("-1"))) {
            allRecords[i] = prevHash[ipfsHash];
            ipfsHash = prevHash[ipfsHash];
            i++;
        }
        return allRecords;
    }

    function getOrigin(string memory ipfsHash)
        public
        view
        returns (string memory)
    {
        // checking whether previous hash is already stored or not
        require(
            keccak256(bytes(prevHash[ipfsHash])) != keccak256(bytes("")),
            "Previous hash is not present"
        );

        while (keccak256(bytes(prevHash[ipfsHash])) != keccak256(bytes("-1"))) {
            ipfsHash = prevHash[ipfsHash];
        }

        return ipfsHash;
    }

    function getPrevHash(string memory s) public view returns (string memory) {
        string memory empty = "empty";
        if (keccak256(bytes(prevHash[s])) == keccak256(bytes(""))) return empty;
        return prevHash[s];
    }
}
