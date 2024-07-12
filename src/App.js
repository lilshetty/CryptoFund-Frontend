import React, { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import Crowdfunding from './contracts/Crowdfunding.json';
import './App.css';

const App = () => {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [description, setDescription] = useState('');
    const [goal, setGoal] = useState(0);

    useEffect(() => {
        const init = async () => {
            try {
                if (window.ethereum) {
                    const web3 = new Web3(window.ethereum);
                    await window.ethereum.request({ method: 'eth_requestAccounts' });
                    const accounts = await web3.eth.getAccounts();
                    const networkId = await web3.eth.net.getId();
                    const deployedNetwork = Crowdfunding.networks[networkId];
                    const contract = new web3.eth.Contract(
                        Crowdfunding.abi,
                        deployedNetwork && deployedNetwork.address,
                    );

                    setWeb3(web3);
                    setAccount(accounts[0]);
                    setContract(contract);
                } else {
                    alert("Please install MetaMask to use this dApp!");
                }
            } catch (error) {
                console.error("Error connecting to MetaMask:", error);
            }
        };
        init();
    }, []);

    const loadCampaigns = useCallback(async () => {
        if (contract) {
            const campaignCount = await contract.methods.campaignCount().call();
            const campaigns = [];
            for (let i = 0; i < campaignCount; i++) {
                const campaign = await contract.methods.getCampaign(i).call();
                campaigns.push(campaign);
            }
            setCampaigns(campaigns);
        }
    }, [contract]);

    useEffect(() => {
        if (contract) {
            loadCampaigns();
        }
    }, [contract, loadCampaigns]);

    const createCampaign = async () => {
        if (contract) {
            await contract.methods.createCampaign(description, goal).send({ from: account });
            loadCampaigns();
        }
    };

    const donate = async (campaignId, amount) => {
        if (contract) {
            await contract.methods.donate(campaignId).send({
                from: account,
                value: web3.utils.toWei(amount, 'ether')
            });
            loadCampaigns();
        }
    };

    return (
        <div className="app">
            <h1>CryptoFund</h1>
            <div className="create-campaign">
                <h2>Create Campaign</h2>
                <input
                    type="text"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Goal (ETH)"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                />
                <button onClick={createCampaign}>Create</button>
            </div>
            <div className="campaigns">
                <h2>Active Campaigns</h2>
                {campaigns.map((campaign, index) => (
                    <div key={index} className="campaign">
                        <p><strong>Description:</strong> {campaign.description}</p>
                        <p><strong>Goal:</strong> {web3.utils.fromWei(campaign.goal.toString(), 'ether')} ETH</p>
                        <p><strong>Pledged:</strong> {web3.utils.fromWei(campaign.pledged.toString(), 'ether')} ETH</p>
                        <p><strong>Completed:</strong> {campaign.completed ? 'Yes' : 'No'}</p>
                        {!campaign.completed && (
                            <button onClick={() => donate(index, '0.001')}>Donate 0.001 ETH</button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default App;
