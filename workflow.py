from web3 import Web3
from time import sleep
import safe

# CUSTOM SETTINGS
INFURA_PRIVATE_KEY = safe.INFURA_PRIVATE_KEY
EOA_ACCOUNT = Web3.toChecksumAddress(safe.EOA_ACCOUNT)
EOA_PRIVATE_KEY = safe.EOA_PRIVATE_KEY
CHECK_TRX_POLL_LATENCY = 60
CHECK_TRX_TIMEOUT = 600

ROPSTEN_ORACLE_ADDRESS = "0x5907998f1BE158D08C43105c3862200f7718e26e"
ROPSTEN_LOTTERY_ADDRESS = "0x737e229cc849047a35d7B2B9ca6f1Ebd6eaF1a3F"
PROVIDER = f"https://ropsten.infura.io/v3/{INFURA_PRIVATE_KEY}"

ORACLE_ADDRESS = Web3.toChecksumAddress(ROPSTEN_ORACLE_ADDRESS)
ORACLE_ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "receipt",
                "type": "uint256"
            }
        ],
        "name": "existRandom",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "fee",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "receipt",
                "type": "uint256"
            }
        ],
        "name": "getRandom",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getReceipt",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "receipt",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            }
        ],
        "name": "isInSafeList",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "receipt",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "forAddress",
                "type": "address"
            }
        ],
        "name": "requestRandom",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
]

LOTTERY_ADDRESS = Web3.toChecksumAddress(ROPSTEN_LOTTERY_ADDRESS)
LOTTERY_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": False,
                "internalType": "uint256",
                "name": "winner",
                "type": "uint256"
            }
        ],
        "name": "WinnerDeclared",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_oracleReceipt",
                "type": "uint256"
            }
        ],
        "name": "declareWinner",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getWinner",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

W3 = Web3(Web3.HTTPProvider(PROVIDER))

if not W3.isConnected():
    raise Exception("Not connected to network provider.")


def oracle_get_fee():
    contract = W3.eth.contract(address=ORACLE_ADDRESS, abi=ORACLE_ABI)
    fee = contract.functions.fee().call()
    print(f"ORACLE.call.fee() return '{fee}'")
    return fee


def oracle_get_receipt():
    contract = W3.eth.contract(address=ORACLE_ADDRESS, abi=ORACLE_ABI)
    receipt = contract.functions.getReceipt().call()
    print(f"ORACLE.call.getReceipt() return '{receipt}'")
    return receipt


def oracle_request_random(receipt):
    contract = W3.eth.contract(address=ORACLE_ADDRESS, abi=ORACLE_ABI)
    nonce = W3.eth.get_transaction_count(EOA_ACCOUNT)
    fee = oracle_get_fee()
    ethfee = W3.fromWei(fee, "ether")
    transaction = contract.functions.requestRandom(
        receipt,
        LOTTERY_ADDRESS
    ).buildTransaction({
        "gasPrice": W3.eth.gas_price,
        'from': EOA_ACCOUNT,
        'nonce': nonce,
        'value': fee
    })
    signed_txn = W3.eth.account.sign_transaction(transaction,
                                                 private_key=EOA_PRIVATE_KEY)
    tx_hash_primitive = W3.eth.send_raw_transaction(signed_txn.rawTransaction)
    tx_hash = W3.toHex(tx_hash_primitive)
    print(f"ORACLE.transaction.requestRandom(RECEIPT, LOTTERY) [PAY {ethfee}]")
    print(f"\tTransaction hash: {tx_hash}")
    print("\tWait for transaction receipt...")
    W3.eth.wait_for_transaction_receipt(tx_hash, timeout=CHECK_TRX_TIMEOUT,
                                        poll_latency=CHECK_TRX_POLL_LATENCY)
    return tx_hash


def oracle_print_test_random(receipt):
    """Useful to test generated Random.
    Il numero restituito tramite il metodo call() è diverso da quello
    che si otterrà tramite una transazione
    Dopo aver ottenuto un random tramite una transazione,
    l'address verrà rimosso dalla safe list e non sarà più possibile utilizzare
    questa funzione.
    """
    contract = W3.eth.contract(address=ORACLE_ADDRESS, abi=ORACLE_ABI)
    n = contract.functions.getRandom(receipt).call({"from": LOTTERY_ADDRESS})
    print(f"ORACLE.call.getRandom(RECEIPT) return '{n}'")


def wait_for_random(receipt):
    contract = W3.eth.contract(address=ORACLE_ADDRESS, abi=ORACLE_ABI)
    exist_random = False
    while not exist_random:
        exist_random = contract.functions.existRandom(receipt).call()
        print(f"ORACLE.call.existRandom(RECEIPT) return '{exist_random}'")
        if exist_random:
            is_safe = contract.functions.isInSafeList(
                receipt,
                LOTTERY_ADDRESS
            ).call()
            print(f"ORACLE.call.isInSafeList(RECEIPT, LOTTERY) "
                  f"return '{is_safe}'")
            if not is_safe:
                raise Exception("\tRandom exists but address "
                                f"'{LOTTERY_ADDRESS}' is not in safe list.")
        else:
            print("\tRandom not exists yet - Retry in 30 sec...")
            sleep(30)


def lottery_declare_winner(receipt):
    """Interazione con lo smart contract lottery per dichiarare il vincitore.
    """
    contract = W3.eth.contract(address=LOTTERY_ADDRESS, abi=LOTTERY_ABI)
    nonce = W3.eth.get_transaction_count(EOA_ACCOUNT)
    transaction = contract.functions.declareWinner(
        receipt
    ).buildTransaction({
        "gasPrice": W3.eth.gas_price,
        'from': EOA_ACCOUNT,
        'nonce': nonce,
    })
    signed_txn = W3.eth.account.sign_transaction(transaction,
                                                 private_key=EOA_PRIVATE_KEY)
    tx_hash_primitive = W3.eth.send_raw_transaction(signed_txn.rawTransaction)
    tx_hash = W3.toHex(tx_hash_primitive)
    print(f"LOTTERY.transaction.declareWinner(RECEIPT)")
    print(f"\tTransaction hash: {tx_hash}")
    print("\tWait for transaction receipt...")
    W3.eth.wait_for_transaction_receipt(tx_hash, timeout=CHECK_TRX_TIMEOUT,
                                        poll_latency=CHECK_TRX_POLL_LATENCY)
    return tx_hash


def lottery_print_winner():
    """Mostra il vincitore della lotteria.
    Nel caso della lottery di esempio viene restituto il numero random
    ricevuto dallo smart contract dall'oracolo.
    """
    contract = W3.eth.contract(address=LOTTERY_ADDRESS, abi=LOTTERY_ABI)
    winner_id = contract.functions.getWinner().call()
    print(f"LOTTERY.call.getWinner() return {winner_id}")
    print(f"\n\t*** Lottery winner/Generated-random IS '{winner_id}' ***")


def workflow():

    print(f"use ORACLE = {ORACLE_ADDRESS} (smart contract)")
    print(f"use LOTTERY = {LOTTERY_ADDRESS} (smart contract)")

    receipt = oracle_get_receipt()

    print(f"use RECEIPT = {receipt}")

    oracle_request_random(receipt)

    wait_for_random(receipt)

    oracle_print_test_random(receipt)

    lottery_declare_winner(receipt)

    lottery_print_winner()


if __name__ == '__main__':
    workflow()
