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
          "indexed": true,
          "internalType": "string",
          "name": "item",
          "type": "string"
        },
        {
          "indexed": true,
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
          "internalType": "bool",
          "name": "is_sold",
          "type": "bool"
        },
        {
          "indexed": true,
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
          "internalType": "bool",
          "name": "isSold",
          "type": "bool"
        },
        {
          "internalType": "address",
          "name": "buyer",
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
      "inputs": [],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
];

let signer;
let contract;

const connectBtn = document.getElementById('connectBtn');
const additem = document.getElementById('additem');
const inventoryDiv = document.getElementById('inventory');

// 2. Connect Wallet Logic
async function connect() {
    if (window.ethereum) {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
            const address = await signer.getAddress();

            document.getElementById('walletAddress').innerText = `Connected: ${address}`;
            connectBtn.innerText = "Connected";

            // Initialize Contract
            contract = new ethers.Contract(contractAddress, abi, signer);

            const buyItemEvent = contract.on("BuyItem", loadInventory());
            const addItemEvent = contract.on("AddItem", loadInventory());

            loadInventory();

            } catch (err) {
                console.error("User denied connection", err);
            }
        } else {
            alert("Please install MetaMask!");
        }
    }

// 3. Load and Display Inventory
async function loadInventory() {
    inventoryDiv.innerHTML = "Loading items...";
    const count = await contract.nextItemId();
    inventoryDiv.innerHTML = ""; // Clear loader
    console.log("showing inventory...");

    for (let i = 0; i < count; i++) {
        const item = await contract.inventory(i);
        displayItem(item);
    }
}

async function add_item_to_inventory() {
    if (!contract){
        console.error("Connect to wallet first.");
        return;
    }
    const item_name = document.getElementById('item-name').value;
    const item_price = document.getElementById('item-price').value;

    if (!item_name || !item_price) {
        console.error("Name and Price are required!");
        return;
    }
    try {
        const price_in_Wei = ethers.parseEther(item_price);
        const tx = await contract.addItem(item_name, price_in_Wei);
        await tx.wait();
        await loadInventory();
    } catch (err) {
        console.error("MetaMask Trigger Error:", err);
    }
}

function displayItem(item) {
    const card = document.createElement('div');
    card.className = `item-card ${item.isSold ? 'sold' : ''}`;

    // Convert price from Wei to ETH for readability
    const priceInEth = ethers.formatEther(item.price);

    card.innerHTML = `
        <h3>${item.name}</h3>
        <p>Price: ${priceInEth} ETH</p>
        <p>Status: ${item.isSold ? 'SOLD' : 'Available'}</p>
        ${!item.isSold ? `<button onclick="buy(${item.id.toString()})">Buy Now</button>` : ''}
    `;
    inventoryDiv.appendChild(card);
}

// 4. Purchase Logic
window.buy = async (id) => {
    try {
        const item = await contract.inventory(id);
        const tx = await contract.buyItem(id, { value: item.price });

        console.log("Transaction sent...", tx.hash);
        await tx.wait(); // Wait for block confirmation

        alert("Success! Hardware claimed.");
        loadInventory(); // Refresh UI
    } catch (err) {
        console.error("Purchase failed", err);
    }
};

connectBtn.onclick = connect;
const inventoryForm = document.getElementById('additem-form');

inventoryForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevents the page from reloading
    await add_item_to_inventory(); // Calls your existing logic
});

