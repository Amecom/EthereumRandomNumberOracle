let uin = null;

const fun = {

    asyncIterate: function (elements, fxOnElement, fxOnDone) {
        const eleIsArray = Array.isArray(elements);
        const gLen = eleIsArray ? elements.length : elements;
        let i = gLen;
        let gResult = true;
        let gCountDone = 0;
        if (gLen) {
            for (i = 0; i < gLen; i += 1) {
                fxOnElement(
                    eleIsArray ? elements[i] : i,
                    onComplete,
                    i
                );
            }
        } else {
            fxOnDone(true);
        }

        function onComplete(result) {
            gResult = gResult && result;
            gCountDone += 1;
            if (gCountDone === gLen) {
                fxOnDone(gResult);
            }
        }
    },

    nodeEmpty: function (node) {
        if (node) {
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
        }
    },

    nodeReplace: function (node, newContent) {
        this.nodeEmpty(node);
        node.appendChild(newContent);
    },

}

const metamask = {

    provider: null,

    web3: null,

    effectEnabled: false,

    connect: async function (onSuccess, onError) {
        let provider = metamask.provider;
        provider.request({method: 'eth_requestAccounts'})
            .then((result) => {
                // noinspection JSUnresolvedFunction
                metamask.web3 = new Web3(metamask.provider);
                game.contract = new metamask.web3["eth"]["Contract"](game.abi, game.address);
                onSuccess(result)
            })
            .catch((error) => onError(error.message));
    },

    getProvider: async function () {
        let provider = metamask.provider;
        if (provider) {
            return provider;
        } else {
            // noinspection JSUnresolvedFunction
            provider = await detectEthereumProvider(true);
            if (provider) {
                metamask.provider = provider;
                metamask.useEffect();
                return provider;
            } else {
                return null;
            }
        }
    },

    getStringChainId: function () {
        const provider = metamask.provider;
        return provider ? provider["networkVersion"] : "";
    },

    getAccount: function () {
        const provider = metamask.provider;
        return provider ? provider["selectedAddress"] : "";
    },

    useEffect: () => {
        const provider = metamask.provider;
        if (provider && !metamask.effectEnabled) {
            provider.on('chainChanged', (/*_chainId*/) => window.location.reload());
            provider.on('accountsChanged', (/*_addr*/) => window.location.reload());
            metamask.effectEnabled = true;
        }
    },

}

const game = {

    address: "0x3452fe2736f63f7767E319da6b4E902F23ecE01f",

    abi: [
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [],
            "name": "askFreeFiches",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "betResult",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "existsBetResult",
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
            "name": "getFee",
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
            "name": "getOracle",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
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
            "name": "getPlayerBet",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "uint8",
                            "name": "card",
                            "type": "uint8"
                        },
                        {
                            "internalType": "uint256",
                            "name": "fiches",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "used_random",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint8",
                            "name": "pulled_out_card",
                            "type": "uint8"
                        },
                        {
                            "internalType": "bool",
                            "name": "win",
                            "type": "bool"
                        }
                    ],
                    "internalType": "struct three_card.Bet",
                    "name": "",
                    "type": "tuple"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getPlayerFiches",
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
            "name": "getPlayerPendingReceipt",
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
            "name": "getPlayerReceipts",
            "outputs": [
                {
                    "internalType": "uint256[]",
                    "name": "",
                    "type": "uint256[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint8",
                    "name": "card",
                    "type": "uint8"
                },
                {
                    "internalType": "uint256",
                    "name": "fiches",
                    "type": "uint256"
                }
            ],
            "name": "makeBet",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_a",
                    "type": "address"
                }
            ],
            "name": "setOracle",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ],

    chain_id: "3",    // "Ropsten Test Network",

    contract: () => {
    },

    feeToPlay: 0,

    player: {
        fiches: 0,
        pendingReceipt: ""
    },

    /* BLOCKCHAIN TRANSACTION */
    askFreeFiches: (onSuccess, onError, onHash) => {
        game.contract.methods['askFreeFiches']()
            .send({from: metamask.getAccount()})
            .on('transactionHash', (hash) => onHash(hash))
            .then((_trxReceipt) => onSuccess())
            .catch((err) => onError("Failed with error: " + err.message));
    },

    makeBet: (card, fiches, onSuccess, onError, onHash) => {
        game.contract.methods['makeBet'](card, fiches)
            .send({from: metamask.getAccount(), value: game.feeToPlay})
            .on('transactionHash', (hash) => onHash(hash))
            .then((_trxReceipt) => onSuccess())
            .catch((err) => onError("Failed with error: " + err.message));
    },

    betResult: (onSuccess, onError, onHash) => {
        game.contract.methods['betResult']()
            .send({from: metamask.getAccount()})
            .on('transactionHash', (hash) => onHash(hash))
            .then((_trxReceipt) => onSuccess())
            .catch((err) => onError("Failed with error: " + err.message));
    },

    /* BLOCKCHAIN CALL */

    existsBetResult: (onSuccess, onError) => {
        game.contract.methods["existsBetResult"]().call({from: metamask.getAccount()}, (error, result) => {
            if (error) {
                onError(error);
            } else {
                onSuccess(result);
            }
        });

    },

    getPlayerBet: (receipt, onSuccess, onError) => {
        game.contract.methods['getPlayerBet'](receipt).call({from: metamask.getAccount()}, (error, result) => {
            if (error) {
                onError(error);
            } else {
                onSuccess(result);
            }
        });
    },

    /* BLOCKCHAIN CALL & SET VAR */

    setFee: (onSuccess, onError) => {
        game.contract.methods["getFee"]().call({from: metamask.getAccount()}, (error, result) => {
            if (error) {
                onError(error);
            } else {
                result = String(result);
                game.feeToPlay = result;
                onSuccess(result);
            }
        });
    },

    setPlayerFiches: (onSuccess, onError) => {
        game.contract.methods["getPlayerFiches"]().call({from: metamask.getAccount()}, (error, result) => {
            if (error) {
                onError(error);
            } else {
                result = parseInt(result);
                game.player.fiches = result;
                onSuccess(result);
            }
        });
    },

    setPlayerPendingReceipt: (onSuccess, onError) => {
        game.contract.methods["getPlayerPendingReceipt"]().call({from: metamask.getAccount()}, (error, result) => {
            if (error) {
                onError(error);
            } else {
                result = String(result);
                game.player.pendingReceipt = result === "0" ? "" : result;
                onSuccess(result);
            }
        });
    },

    /* LOAD ALL VAR */
    loadData: (onSuccess, onError) => {
        const fxs = [
            game.setFee,
            game.setPlayerFiches,
            game.setPlayerPendingReceipt
        ];
        fun.asyncIterate(
            fxs,
            (fx, icall) => {
                fx(
                    () => icall(true),
                    (error) => {
                        onError(error);
                        icall(false)
                    }
                )
            },
            (result) => {
                if (result) {
                    onSuccess();
                }
            }
        )
    }
}

const ui = {

    formatAddress: (address) => address.substring(0, 5) + "…" + address.substring(35),

    formatUint: (label, value) => {
        const short = value.substring(0, 7) + "…" + value.substring(value.length - 7);
        const tag = ui.tag(short, "span", " small");
        tag.title = value;

        const d = document.createElement("div");
        d.appendChild(ui.tag(label, "span", "badge bg-secondary small"))
        d.appendChild(document.createTextNode(" "))
        d.appendChild(tag)
        return d;
    },


    show:  (view) => {
        while (uin.firstChild) {
            uin.removeChild(uin.firstChild);
        }
        [
            ui.playerFiches(),
            ui.playerAddress(),
            view
        ].forEach((n)=>uin.appendChild(n));
    },

    btn: (label, onclick, look="primary") => {
        const b = document.createElement("button");
        b.className = "btn btn-" + look;
        b.appendChild(document.createTextNode(label));
        b.addEventListener("click", onclick);

        const d = document.createElement("div");
        d.className = "my-2 text-center";
        d.appendChild(b)
        return d;
    },

    icon: (cls) => {
        const i = document.createElement("i");
        i.className = cls;
        return i
    },

    title: (text, cls="") => {
        const h = document.createElement("div");
        h.className = "fs-6 fw-bold " + cls ;
        h.appendChild(document.createTextNode(text));
        return h;
    },

    tag: (text, tag="div", cls="") => {
        const h = document.createElement(tag);
        h.className = cls ;
        h.appendChild(document.createTextNode(text));
        return h;
    },


    playerFiches: () => {
        const d = document.createElement("div");
        d.id = "player-fiches";
        d.className = "badge bg-secondary text-white";
        d.appendChild(ui.icon("fa-solid fa-coins coins-color"));
        d.appendChild(document.createTextNode(" " + String(game.player.fiches)));
        return d;
    },

    playerAddress: () => {
        const account = metamask.getAccount();
        const d = document.createElement("div");
        d.id = "player-address";
        d.className = "badge bg-secondary text-white";
        d.appendChild(ui.icon("fa-solid fa-user"));
        d.title = account;
        if (account) {
            d.appendChild(document.createTextNode(" " + ui.formatAddress(String(metamask.getAccount()))));
        } else {
            d.appendChild(document.createTextNode(" Not Connected"));
        }
        return d;
    },

    alert: (text, name="info") =>{
        const d = document.createElement("div");
        d.className = "alert alert-" + name;
        d.appendChild(document.createTextNode(text))
        return d;
    },

    wait: (text) =>{
        const d = document.createElement("div");
        d.className = "view-wait alert alert-dark";
        d.appendChild(ui.icon("fa-duotone fa-spinner fa-spin-pulse"));
        d.appendChild(document.createTextNode(" " + text))
        return d;
    },

    confirmTransaction: (forWhat) =>  ui.wait("Please, confirm on metamask " + forWhat),

    waitTransactionCofirmed: () => ui.wait("Wait for the transaction to be confirmed…"),

    error: (message) => {
        const b = ui.btn(
            "Continue",
            () => ui.show(view.switchByData()),
            "primary"
        );

        const d = document.createElement("div");
        d.className = "text-center";
        d.appendChild(ui.alert(message, "danger"));
        d.appendChild(b);
        return d;
    },

    timerToExecute: (seconds, onTimeout) => {
        let countdown = seconds;
        const d = document.createElement("div");
        d.className = "badge bg-dark";
        const dtime = document.createElement("span");
        d.appendChild(document.createTextNode("Retry in "));
        d.appendChild(dtime)
        d.appendChild(document.createTextNode(" seconds"));

        const updateCoutdown = () => {
            fun.nodeReplace(
                dtime,
                document.createTextNode(String(countdown))
            )
        }
        const nextCount = () => {
            window.setTimeout(
                () => {
                    countdown -= 1;
                    if (countdown) {
                        updateCoutdown()
                        nextCount();
                    } else {
                        onTimeout()
                    }
                },
                1000
            )
        }
        updateCoutdown(countdown);
        nextCount();
        return d;
    },

    explainBet: (card, fiches) => {
        const d = document.createElement("div");
        d.className = "bg-secondary text-white text-center";
        [
            document.createTextNode("You bet " + String(fiches) + " "),
            ui.icon("fa-solid fa-coins coins-color p-1"),
            //coins on chest number 3")
            document.createTextNode(" in "),
            ui.icon("fa-solid fa-treasure-chest chest-color p-1"),
            document.createTextNode(" number " + String(card)),
        ].forEach((n)=> d.appendChild(n))
        return d;
    }

}

const view = {

    connect: () => ui.btn(
        "Connect Metamask",
        async () => {
            metamask.getProvider()
                .then((/*provider*/) => {
                        metamask.connect(
                            () => {
                                const isValidChain = metamask.getStringChainId() === game.chain_id;
                                if (isValidChain) {
                                    ui.show(view.switchByData());
                                } else {
                                    ui.show(view.changeNetwork());
                                }
                            },
                            (text) => {
                                ui.show(ui.error(text));
                            }
                        )
                    }
                ).catch((e) => {
                    ui.show(ui.error(e));
                }
            )
        },
        "primary"
    ),

    changeNetwork: ui.alert("This game works on Ethereum Test Network Ropsten. Please switch on Ropsten Test Newtork on MetaMask.", "danger"),

    switchByData: () => {
        const d = document.createElement("div");
        if (metamask.provider && metamask.provider["selectedAddress"]) {
            d.appendChild(ui.wait("Wait for loading data…"))
            game.loadData(
                () => {
                    const pendingReceipt = game.player.pendingReceipt;
                    const fiches = game.player.fiches;
                    let v;
                    // if (1){
                    //     v = view.showResult("37718237250412330443918228637953203732025126649167049944176529503986299070300");
                    // } else
                    if (pendingReceipt) {
                        v = view.pendingBet();

                    } else if (fiches === 0) {
                        v = view.askFreeFiches();

                    } else {
                        v = view.makeBet();
                    }
                    ui.show(v);
                },
                (error) => ui.show(ui.error(error))
            )
        } else {
            setTimeout(
                () => ui.show(view.connect()),
                1000
            )
        }
        return d;
    },

    askFreeFiches: () => {
        const b = ui.btn(
            "Request free doubloons",
            () => {
                ui.show(ui.confirmTransaction("to get free doubloons"));
                game.askFreeFiches(
                    () => ui.show(view.switchByData()),
                    (message) => ui.show(ui.error(message)),
                    (_hash) => ui.show(ui.waitTransactionCofirmed())
                )
            },
            "primary"
        );

        const tag = document.createElement("div");
        tag.className = "badge bg-dark d-block my-2";
        tag.appendChild(document.createTextNode("You have zero "));
        tag.appendChild(ui.icon("fa-solid fa-coins coins-color p-1"));
        tag.appendChild(document.createTextNode(" doubloons"));

        const d = document.createElement("div");
        d.className = "texct-center";
        d.appendChild(tag)
        d.appendChild(b);
        d.appendChild(ui.alert("A transaction is required to save the data in the blockchain", "small"))
        return d;
    },

    makeBet: () => {

        const cardSelector = document.createElement("div");
        cardSelector.className = "card-selector";

        for (let i = 1; i <= 3; i +=1){
            const cardId = "card_" + String(i)
            const input = document.createElement("input");
            input.type = "radio";
            input.id = cardId;
            input.value = String(i);
            input.name = "bet_card";

            const label = document.createElement("label");
            label.className = "cc-card " + cardId;
            label.setAttribute("for", cardId);

            cardSelector.appendChild(input);
            cardSelector.appendChild(label);
        }

        const selectFiches = document.createElement("select");
        const maxBet = parseInt(game.player.fiches);
        const suggestedBet = maxBet < 10 ? maxBet : 10;
        for (let i = 1; i <= maxBet; i+=1){
            const option = document.createElement("option");
            option.appendChild(document.createTextNode(String(i)));
            option.value = String(i);
            if (i === suggestedBet) {
                option.selected = true
            }
            selectFiches.appendChild(option)
        }

        const submit = ui.btn(
            "BET",
            () => {
                fun.nodeEmpty(divWarning);

                let selectdCard = "";
                let nFiches = parseInt(selectFiches.value);

                const radios = document.getElementsByName('bet_card');

                for (let i = 0; i < radios.length;  i += 1) {
                  if (radios[i].checked) {
                    // do whatever you want with the checked radio
                    selectdCard = radios[i].value;
                    // only one radio can be logically checked, don't check the rest
                    break;
                  }
                }

                let error = "";
                if (!selectdCard){
                    error = "No card selected";
                }
                if (!nFiches){
                    error = "No valid bet";
                }
                if (!error) {
                    ui.show(view.makeBetTransaction(selectdCard, nFiches));
                }
            },
            "primary"
        );

        const divSelectFiches = document.createElement("div");
        divSelectFiches.className = "mt-2";
        divSelectFiches.appendChild(ui.icon("fa-solid fa-coins coins-color bg-dark p-1 rounded-3"));
        divSelectFiches.appendChild(document.createTextNode(" "));
        divSelectFiches.appendChild(selectFiches);

        const divWarning = document.createElement("div");

        const d = document.createElement("div");
        d.className = "text-center";
        [
            ui.title("Where is the treasure?"),
            ui.tag("Click on the chest where you think the treasure is.", "div", "text-white badge bg-dark"),
            cardSelector,
            ui.title("How much do you bet?"),
            ui.tag("Choose the number of doubloons you want to bet", "div", "text-white badge bg-dark"),
            divSelectFiches,
            submit,
            ui.alert("A transaction with a fee of " + metamask.web3["utils"]["fromWei"](game.feeToPlay) + " eth is required to play", "small")
        ].forEach((n)=> d.appendChild(n));
        return d;
    },

    makeBetTransaction: (card, fiches) => {
        const d = document.createElement("div");
        d.appendChild(ui.confirmTransaction("to make your bet"));
        game.makeBet(
            card,
            fiches,
            () => {
                ui.show(ui.wait("Update data…"));
                game.loadData(
                    () => ui.show(view.pendingBet()),
                    (message) => ui.show(ui.error(message))
                )
            },
            (error) => ui.show(ui.error(error)),
            (_hash) => fun.nodeReplace(d, ui.waitTransactionCofirmed())
        )
        return d;
    },

    pendingBet: () => {
        const d = document.createElement("div");
        d.className = "text-center";
        d.appendChild(ui.wait("Please wait. We are drawing the treasure chest using random-oracle.com. This can take a few minutes."));
        game.existsBetResult(
            (exists) => {
                if (exists) {
                    ui.show(view.betResult())
                } else {
                    d.appendChild(
                        ui.timerToExecute(
                            30,
                            () => ui.show(view.pendingBet())
                        )
                    )
                }
            },
            (message) => ui.show(ui.error(message))
        );
        return d;
    },

    betResult: () => {
        const b = ui.btn(
            "GET THE RESULT",
            () => {
                ui.show(ui.confirmTransaction("for result"));

                game.betResult(
                    () => {
                        ui.show(view.showResult(game.player.pendingReceipt))
                        game.player.pendingReceipt = "";
                    },
                    (message) => ui.show(ui.error(message)),
                    (_hash) => ui.show(ui.waitTransactionCofirmed())
                )
            }
        );
        const d = document.createElement("div");
        d.className = "text-center";
        d.appendChild(ui.title("Extraction done"));
        d.appendChild(ui.tag("Click the button to find out if you have won!", "div", "badge bg-dark my-3"))
        d.appendChild(b);
        d.appendChild(
            ui.alert("A transaction is required to save game result on blockchain", "small")
        )
        return d;
    },

    showResult: (receipt) => {
        const d = document.createElement("div");
        d.appendChild(ui.wait("Retrieving info…"));

        const viewOnResult = (data) => {
            const d = document.createElement("div");
            const playerCard = parseInt(data["card"]);
            const playerFiches = data["fiches"];
            const playerWin = data["win"];
            const pulledOutCard = parseInt(data["pulled_out_card"]);
            const usedRandom = data["used_random"];

            const row = document.createElement("div");
            row.className = "row g-0";

            for (let i = 1; i <= 3; i += 1) {
                let imgSuffix = i === pulledOutCard ? "full" : "empty";

                const img = document.createElement("img");
                img.src = "chest_" + imgSuffix + ".png";

                if (i === playerCard) {
                    img.className = "chest-image";
                } else {
                    img.className = "chest-image opaque";
                }

                const col = document.createElement("div");
                col.className = "col";
                col.appendChild(img);

                if (i === playerCard) {
                    col.appendChild(ui.tag("Your chest", "div", "badge bg-secondary d-block m-1"));
                }
                if (i === pulledOutCard){
                    col.appendChild(ui.tag("Winner chest", "div", "badge bg-secondary d-block m-1"));
                }

                row.appendChild(col);
            }

            const b = ui.btn(
                "Continue",
                () => ui.show(view.switchByData()),
                "primary"
            );

            d.appendChild(ui.explainBet(playerCard, playerFiches))
            if (playerWin) {
                d.appendChild(ui.tag("YOU WIN", "div", "fs-5 badge bg-success d-block my-1"));
            } else {
                d.appendChild(ui.tag("YOU LOSE", "div", "fs-5 badge bg-danger d-block my-1"));
            }
            d.appendChild(row);
            d.appendChild(ui.formatUint("Game receipt", receipt));
            d.appendChild(ui.formatUint("Used random", usedRandom));
            d.appendChild(b);
            return d;
        }

        game.getPlayerBet(
            receipt,
            (data) => ui.show(viewOnResult(data)),
            (message) => ui.show(ui.error(message))
        )
        return d;
    },

}

const fullscreen = () => {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const mainW = uin.offsetWidth;
    const mainH = uin.offsetHeight;
    const rpW = screenW / mainW;
    const rpH = screenH / mainH;
    const absRpW = Math.abs(rpW);
    const absRpH = Math.abs(rpH);
    const useRp = absRpW < absRpH ? rpW : rpH;
    const resizeRap = useRp - 0.1;
    uin.style.transform = "scale(" + String(resizeRap) + ")";
}

const load = () => {
    uin = document.getElementById("game");
    ui.show(view.connect());
    fullscreen()
}
