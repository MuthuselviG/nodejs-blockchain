import * as crypto from 'crypto';

//1. Transaction which has the information about amount, who is paying and who get paid
// payer and payee are the public keys
class Transaction{
    constructor(
        public amount: number,
        public payer: string,
        public payee: string
    ){}

    toString(){
        return JSON.stringify(this);
    }

}

//2. Block - similar to items in linked list. contains transaction, prev hash and time stamp
// prev hash is to identify the previous block
// uses SHA256, will not be able to decrypt
class Block{

    public nonce = Math.round(Math.random() * 999999999);

    constructor(
        public prevHash: string,
        public transaction: Transaction,
        public ts= Date.now()
    ){}

    get hash(){
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }

}

//3. Chain - Initializes the block chain
class Chain{
    public static instance = new Chain();

    chain: Block[];
    
    // initialises first transaction
    constructor(){
        this.chain = [new Block('', new Transaction(100, 'genesis','satoshi'))];
    }


    mine(nonce: number){
         let solution =1;

         console.log("... Mining...");
         

        while(true){
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');

            if(attempt.substring(0,4) === '0000'){
                console.log(`Solved : ${solution}`);
                return solution;
            }
            
            solution+=1;
        }
    }

    // to get the last block. ex: required to link the latest block to the chain
    get lastBlock(){
        return this.chain[this.chain.length -1];
    }

    // to add new block to the chain
    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer){
       // const newBlock = new Block(this.lastBlock.hash, transaction);
        //this.chain.push(newBlock);
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature);

        if(isValid){
            const newBlock= new Block(this.lastBlock.hash, transaction);
            this.chain.push(newBlock);
        }
    }

}

class Wallet{
    public privateKey: string;
    public publicKey: string;

    constructor(){
        const keypair =  crypto.generateKeyPairSync('rsa',{
            modulusLength: 2048,
            publicKeyEncoding: {type: 'spki', format:'pem'},      
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },

        });

        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }

    // uses the private key of the user to sign the transaction which
    //can be later verified using signature and the public key
    sendMoney(amount: number, payeePublicKey: string){
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);

    }

}

const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();

satoshi.sendMoney(50, bob.publicKey);
bob.sendMoney(23, alice.publicKey);
alice.sendMoney(5, bob.publicKey);

console.log(Chain.instance);