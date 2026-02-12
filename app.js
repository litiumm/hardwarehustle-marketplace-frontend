// 1. Configuration
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const abi = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "name": "AddItem",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "name": "BuyItem",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_priceInWei",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_count",
          "type": "uint256"
        }
      ],
      "name": "addItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "buyItem",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getBuyers",
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
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "inventory",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "count",
          "type": "uint256"
        },
        {
          "internalType": "address payable",
          "name": "seller",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextItemId",
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
      "name": "organizer",
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
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "userPurchases",
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
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
];

let signer;
let contract;
let organizerAddress;

const connectBtn = document.getElementById('connectBtn');
const inventoryDiv = document.getElementById('inventory');
const adminPanel = document.getElementById('admin-panel');

async function connect() {
    if (window.ethereum) {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
            const address = await signer.getAddress();

            document.getElementById('walletAddress').innerText = `Connected: ${address}`;
            connectBtn.innerText = "Wallet Connected";

            contract = new ethers.Contract(contractAddress, abi, signer);

            // Fetch Organizer Address for Admin UI
            organizerAddress = await contract.organizer();
            if (address.toLowerCase() === organizerAddress.toLowerCase()) {
                adminPanel.style.display = 'block';
            } else {
                adminPanel.style.display = 'none';
            }

            // Correctly set up event listeners
            contract.removeAllListeners(); // Prevent duplicate listeners
            contract.on("BuyItem", () => {
                console.log("Blockchain event: Item Bought");
                loadInventory();
            });
            contract.on("AddItem", () => {
                console.log("Blockchain event: Item Added");
                loadInventory();
            });

            loadInventory();

        } catch (err) {
            console.error("Connection error", err);
        }
    } else {
        alert("Please install MetaMask!");
    }
}

async function loadInventory() {
    inventoryDiv.innerHTML = "<p>Updating inventory...</p>";
    try {
        const count = await contract.nextItemId();
        inventoryDiv.innerHTML = "";

        for (let i = 0; i < count; i++) {
            const item = await contract.inventory(i);
            displayItem(item);
        }
    } catch (err) {
        console.error("Failed to load inventory:", err);
    }
}

async function add_item_to_inventory() {
    if (!contract) return;

    const name = document.getElementById('item-name').value;
    const price = document.getElementById('item-price').value;
    const quantity = document.getElementById('item-quantity').value;

    try {
        const priceInWei = ethers.parseEther(price);
        const tx = await contract.addItem(name, priceInWei, quantity);
        await tx.wait();
        alert("Item added successfully!");
    } catch (err) {
        console.error("Add item failed:", err);
    }
}

function displayItem(item) {
    const card = document.createElement('div');
    const isOutOfStock = Number(item.count) === 0;
    card.className = `item-card ${isOutOfStock ? 'sold' : ''}`;

    const priceInEth = ethers.formatEther(item.price);

    card.innerHTML = `
        <h3>${item.name}</h3>
        <p>Price: ${priceInEth} ETH</p>
        <p>Stock: ${item.count.toString()}</p>
        <p>Status: ${isOutOfStock ? 'OUT OF STOCK' : 'Available'}</p>
        ${!isOutOfStock ? `<button onclick="buy(${item.id.toString()})">Buy Now</button>` : ''}
    `;
    inventoryDiv.appendChild(card);
}

window.buy = async (id) => {
    try {
        const item = await contract.inventory(id);
        const tx = await contract.buyItem(id, { value: item.price });
        console.log("Purchase pending...", tx.hash);
        await tx.wait();
        alert("Purchase confirmed!");
    } catch (err) {
        console.error("Purchase failed", err);
    }
};

window.withdrawFunds = async () => {
    try {
        const tx = await contract.withdraw();
        await tx.wait();
        alert("Funds withdrawn to organizer wallet.");
    } catch (err) {
        console.error("Withdrawal failed", err);
    }
};

connectBtn.onclick = connect;

document.getElementById('additem-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await add_item_to_inventory();
});
