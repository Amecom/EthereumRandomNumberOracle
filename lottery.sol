// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract lottery {

    address private _rndOracleAddress = address(0);

    uint256 private _winnerId = 0;

    constructor () {}

    function declareWinner(uint256 _receiptFromRndOracle) public {
        uint256 randomNumber = getRandomNumber(_receiptFromRndOracle);
        _winnerId = randomNumber;
        emit WinnerDeclared(_winnerId);
    }

    function setRndOracleAddress(address _a) public {
        _rndOracleAddress = _a;
    }

    function getRndOracleAddress() public view returns (address){
        return _rndOracleAddress;
    }

    function getRandomNumber(uint256 _receiptFromRndOracle) public returns (uint256) {
        (bool success, bytes memory result) = _rndOracleAddress.call(abi.encodeWithSignature("getRandom(uint256)", _receiptFromRndOracle));
        require(success, "Call Random Oracle return error.");
        return abi.decode(result, (uint256));
    }

    function getWinner() public view returns (uint256){
        return _winnerId;
    }

    event WinnerDeclared(uint256 player);

}
