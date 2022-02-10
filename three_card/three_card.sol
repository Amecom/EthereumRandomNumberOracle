// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

/*
    Example of how a game smart contract, such as a lottery,
    can implement the use of the oracle random number.

    For more information https://www.random-oracle.com
*/
contract three_card {

    address private _owner;

    address private _oracle;

    uint256 private _winner;


    struct Bet {
        uint8 card;
        uint256 fiches;
        // bool hasResult; = se winner_card = 0 non c'è
        uint256 used_random;
        uint8 pulled_out_card;
        bool win;
    }

    struct Player {
        uint256 fiches;
        uint256 pendingReceipt;
        mapping(uint256 => Bet) receiptBet;

        // memorizza in sequenza le giocate fatte dall'utente (i dettagli sono in receiptBet)
        uint256[] receipts;
    }


    mapping(address => Player) private _address_player;

    modifier onlyOwner() {
        require(_owner == msg.sender, "Caller is not the owner");
        _;
    }

    constructor () {
        _owner = msg.sender;
    }

    // restituisce il numero di fiches possedute da un address
    function _countFiches(address a) private view returns (uint256){
        return _address_player[a].fiches;
    }


    // regala fiches a un account che non ne ha
    function askFreeFiches() public {
        Player storage player = _address_player[msg.sender];
        require(player.fiches == 0, "You have fiches");
        player.fiches = 100;
    }

    function makeBet(uint8 card, uint256 fiches) public payable{
        Bet memory bet;
        bet.card = card;
        bet.fiches = fiches;
        // bet.used_random: 0;
        // bet.pulled_out_card: 0;
        // bet.win: false;

        Player storage player = _address_player[msg.sender];

        require(player.pendingReceipt == 0, "Exist other bet");
        require(fiches <= player.fiches, "Insufficient fiches");
        require(card >= 1 && card <= 3, "Invalid card number");

        // ORACLE FEE
        uint256 fee = getFee();
        require(msg.value >= fee, "Insufficient fee");

        // ORACLE RECEIPT
        uint256 receipt = _oracleGetReceipt();

        // ORACLE REQUEST FOR RANDOM (TRANSACTION)
        _oracleRequestRandom(receipt, fee);

        // (bool successRequest, bytes memory _x) = _oracle.call{value: fee}(abi.encodeWithSignature("requestRandom()", receipt));
        // require(successRequest == true, "ORACLE Call to requestRandom(receipt) failed");

        player.pendingReceipt = receipt;
        player.receiptBet[receipt] = bet;
        player.receipts.push(receipt);
    }

    function betResult() public {
        // incluso in existsBetResult >>> require(receipt, "Not bet found");
        require(existsBetResult(), "Bet result is not ready");

        Player storage player = _address_player[msg.sender];
        uint256 pendingReceipt = player.pendingReceipt;

        // porto il random a tre valori possibilie, 1, 2 e 3

        Bet storage receiptBet = player.receiptBet[pendingReceipt];
        receiptBet.used_random = _oracleGetRandom(pendingReceipt);
        receiptBet.pulled_out_card = uint8((receiptBet.used_random % 3) + 1);

        receiptBet.win = receiptBet.pulled_out_card == receiptBet.card;

        if (receiptBet.win){
            // vinto
            player.fiches += receiptBet.fiches;
        } else {
            // perso
            player.fiches -= receiptBet.fiches;
        }

        // rimuovo scommessa pendente
        player.pendingReceipt = 0;
    }


    // metodo da chiamare per sapere quando è possibile ottenere il risultato della scommessa
    function existsBetResult() public view returns (bool) {
        Player storage player = _address_player[msg.sender];
        uint256 pendingReceipt = player.pendingReceipt;
        require(pendingReceipt != 0, "No pending bet");

        (bool successExistsRandom, bytes memory byteExistsRandom) = _oracle.staticcall(abi.encodeWithSignature("existsRandom(uint256)", pendingReceipt));
        require(successExistsRandom, "ORACLE Call to existsRandom() failed");
        bool existsRandom = abi.decode(byteExistsRandom, (bool));
        if (!existsRandom){
            return false;

        } else {
            (bool successIsInSafeList, bytes memory byteIsInSafeList) = _oracle.staticcall(abi.encodeWithSignature("isInSafeList(uint256,address)", pendingReceipt, msg.sender));
            require(successIsInSafeList, "ORACLE Call to isInsafeList() failed");
            bool isInSafeList =  abi.decode(byteIsInSafeList, (bool));
            require(isInSafeList, "Address is not safelist");
            return true;

        }
    }

    function getFee() public view returns (uint256){
        require(_oracle != address(0), "Not defined oracle address");
        (bool successFee, bytes memory bytesFee) = _oracle.staticcall(abi.encodeWithSignature("getFee()"));
        require(successFee, "ORACLE Call to getFee() failed");
        return abi.decode(bytesFee, (uint256));
    }

    function getPlayerFiches() public view returns (uint256){
        Player storage player = _address_player[msg.sender];
        return player.fiches;
    }

    function getPlayerPendingReceipt() public view returns (uint256){
        Player storage player = _address_player[msg.sender];
        return player.pendingReceipt;
    }

    function getPlayerReceipts() public view returns (uint256 [] memory){
        Player storage player = _address_player[msg.sender];
        return player.receipts;
    }

    function getPlayerBet(uint256 receipt) public view returns (Bet memory){
        Player storage player = _address_player[msg.sender];
        return player.receiptBet[receipt];
    }

    // Use the oracle the get random number
    function _oracleGetRandom(uint256 _oracleReceipt) private returns (uint256) {
        (bool success, bytes memory returnBytes) = _oracle.call(abi.encodeWithSignature("getRandomFromOrigin(uint256)", _oracleReceipt));
        require(success, "ORACLE Call to getRandomFromOrigin() failed");
        return abi.decode(returnBytes, (uint256));
    }

    function _oracleGetReceipt() view private returns (uint256){
        (bool successReceipt, bytes memory bytesReceipt) = _oracle.staticcall(abi.encodeWithSignature("getReceipt()"));
        require(successReceipt, "ORACLE Call to getReceipt() failed");
        return abi.decode(bytesReceipt, (uint256));
    }

    function _oracleRequestRandom(uint256 receipt, uint256 fee) private {
        // ORACLE REQUEST FOR RANDOM (TRANSACTION)
        (bool successRequest, ) = _oracle.call{value: fee}(abi.encodeWithSignature("requestRandom(uint256,address)", receipt, msg.sender));
        require(successRequest, "ORACLE Call to requestRandom(receipt) failed");
    }

    // Allow owner change oracle address.
    function setOracle(address _a) public onlyOwner {
        _oracle = _a;
    }

    // Return current oracle address.
    function getOracle() public view returns (address){
        return _oracle;
    }
}
