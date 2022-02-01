from web3 import Web3
from time import sleep
import safe

# CUSTOM SETTINGS
INFURA_PRIVATE_KEY = safe.INFURA_PRIVATE_KEY
EOA_ACCOUNT = Web3.toChecksumAddress(safe.EOA_ACCOUNT)
EOA_PRIVATE_KEY = safe.EOA_PRIVATE_KEY
CHECK_LATENCY = 60
CHECK_TIMEOUT = 600
ROPSTEN_ORACLE_ADDRESS = "0x5907998f1BE158D08C43105c3862200f7718e26e"
ROPSTEN_LOTTERY_ADDRESS = "0x737e229cc849047a35d7B2B9ca6f1Ebd6eaF1a3F"

oracle_address = Web3.toChecksumAddress(ROPSTEN_ORACLE_ADDRESS)
oracle_abi = [
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

lottery_address = Web3.toChecksumAddress(ROPSTEN_LOTTERY_ADDRESS)
lottery_abi = [
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

provider = f"https://ropsten.infura.io/v3/{INFURA_PRIVATE_KEY}"
w3 = Web3(Web3.HTTPProvider(provider))
if not w3.isConnected():
    raise Exception("Not connected to network provider.")

gas_price = w3.eth.gas_price

print(f"use ORACLE = {oracle_address} AS oracle smart contract")
print(f"use LOTTERY = {lottery_address} AS lottery smart contract")

# INTERACTION WITH ORACLE SMART CONTRACT

oracle_contract = w3.eth.contract(address=oracle_address, abi=oracle_abi)
oracle_fx = oracle_contract.functions

# 1 - Get receipt
receipt = oracle_fx.getReceipt().call()

print(f"ORACLE.call.getReceipt() return '{receipt}'")
print(f"use RECEIPT = {receipt}")

# 2 - Get fee
fee = oracle_fx.fee().call()
eth_fee = w3.fromWei(fee, "ether")

print(f"ORACLE.call.fee() return '{fee}'")

# 3 - Request for a random to the oracle smart contract.
#     Oracle requestRandom transaction must:
#       - include receipt
#       - include smart contract address
#         which will be allowed to retrieve the random when ready.
#       - pay the fee for the service
nonce = w3.eth.get_transaction_count(EOA_ACCOUNT)
tx = oracle_fx.requestRandom(receipt, lottery_address).buildTransaction({
    "gasPrice": gas_price,
    'from': EOA_ACCOUNT,
    'nonce': nonce,
    'value': fee
})
sig_tx = w3.eth.account.sign_transaction(tx, private_key=EOA_PRIVATE_KEY)
tx_hash_primitive = w3.eth.send_raw_transaction(sig_tx.rawTransaction)
tx_hash = w3.toHex(tx_hash_primitive)

print(f"ORACLE.transaction.requestRandom(RECEIPT, LOTTERY) [PAY {eth_fee}]")
print(f"\tWait for '{tx_hash}' transaction receipt...")
w3.eth.wait_for_transaction_receipt(
    tx_hash,
    timeout=CHECK_TIMEOUT,
    poll_latency=CHECK_LATENCY
)

# 4 - Wait until random is ready
exist = False
while not exist:
    exist = oracle_fx.existRandom(receipt).call()
    print(f"ORACLE.call.existRandom(RECEIPT) return '{exist}'")
    if not exist:
        print("\tRandom not exists yet - Retry in 30 sec...")
        sleep(30)

# 5 - [OPTIONAL] Print example random
n = oracle_fx.getRandom(receipt).call({"from": lottery_address})
print(f"ORACLE.call.getRandom(RECEIPT) return '{n}'")

# INTERACTION WITH LOTTERY SMART CONTRACT

lottery_contract = w3.eth.contract(address=lottery_address, abi=lottery_abi)
lottery_fx = lottery_contract.functions

# 6 - Execute declareWinner transaction inside lottery smart contract.
#     declareWinner will use the receipt to delegate to the oracle
#     smart contract creating the random calling getRandom(receipt).
nonce = w3.eth.get_transaction_count(EOA_ACCOUNT)
tx = lottery_fx.declareWinner(receipt).buildTransaction({
    "gasPrice": gas_price,
    'from': EOA_ACCOUNT,
    'nonce': nonce
})
sig_tx = w3.eth.account.sign_transaction(tx, private_key=EOA_PRIVATE_KEY)
tx_hash_primitive = w3.eth.send_raw_transaction(sig_tx.rawTransaction)
tx_hash = w3.toHex(tx_hash_primitive)

print(f"LOTTERY.transaction.declareWinner(RECEIPT)")
print(f"\tWait for '{tx_hash}' transaction receipt...")
w3.eth.wait_for_transaction_receipt(
    tx_hash,
    timeout=CHECK_TIMEOUT,
    poll_latency=CHECK_LATENCY
)

# 6 - [OPTIONAL] Print the winner.
winner_id = lottery_fx.getWinner().call()
print(f"LOTTERY.call.getWinner() return {winner_id}")
print(f"\n\t*** Lottery winner/Generated-random IS '{winner_id}' ***")
