
const crypto = require('crypto');
const { util } = require('postchain-client');
const {
  SingleSignatureAuthDescriptor,
  DirectoryServiceBase,
  ChainConnectionInfo,
  Blockchain,
  FlagsType,
  User,
  Operation
} = require('ft3-lib');

// blockchain connection info
class DirectoryService extends DirectoryServiceBase {
  constructor() {
    super([
      new ChainConnectionInfo(
        Buffer.from(
          '0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF',
          'hex'
        ),
        'http://localhost:7740'
      )
    ]);
  }
}


/**********************************************************
@description
**********************************************************/
class PlayerInfo {
  constructor(username, level, strength, speed, skill ) {
  	this.username = username;
	this.level = level;
	this.strength = strength;
	this.speed = speed;
	this.skill = skill;
  }

  toGTV() {
    return [this.username, this.level, this.strength, this.speed, this.skill];
  }
}

/**********************************************************
@description
**********************************************************/
class WeaponInfo {
  constructor(id, name, type, rarity, damage, price){
  	this.id = id;
	this.name = name;
	this.type = type;
	this.rarity = rarity;
	this.damage = damage;
	this.price = price;
  }

  toGTV(){
    return [this.id, this.name, this.type, this.rarity, this.damage, this.price];
  }
}


(async () => {
  // initialize Blockchain object. initialize function receives an id of a blockchain to which
  // we want to connect and a directory service which holds blockchain connection info.
  // Blockchain class provides functions to call rell operations and queries.
  // it is used by all ft3 lib entities (Asset, Account, ...) to interact with a blockchain.
  const blockchain = await Blockchain.initialize(
      Buffer.from(
        '0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF',
        'hex'
      ),
      new DirectoryService()
  );

  // create a dapp user. an instance of User object holds data needed to sign transaction
  // and to interact with the ft3 lib. it doesn't represent dapp account. with a user object
  // it is possible to access multiple dapp accounts, and a dapp account could have multiple
  // users linked to it (through authentication descriptor).
  const keyPair = util.makeKeyPair();
  const user = new User(
    keyPair,
    new SingleSignatureAuthDescriptor(
      keyPair.pubKey,
      [FlagsType.Account, FlagsType.Transfer]
    )
  );

  // STEP 3 - create a player
  let playerInfo = new PlayerInfo("player1", 1, 5, 10, 5);

  // call 'my_game.create_player' operation to create a new dapp account. the first parameter is
  // dapp user. call function uses user keyPair property to sign the transaction, the
  // rest of parameters are passed to blockchain 'my_game.create_player' operation.
  try {
    await blockchain.call(
      new Operation(
        'my_game.create_player',
        playerInfo.toGTV(),
        user.authDescriptor
      ),
      user
    );
  } catch (error) {
    console.log(`Error creating new player: ${error.message}`);
    process.exit(1);
  }

  console.log("STEP 3 COMPLETED");

  // STEP 4 - lookup user account
  // get created account details by calling find_player_by_usernamequery
  let userAccount = await blockchain.query('my_game.find_player_by_username', {
  	username: playerInfo.username
  });
  console.log("STEP 4 RESULTS: " , userAccount);

  // STEP 5 - update player
  playerInfo = new PlayerInfo("player1", 10, 50, 100, 50);

  try{
    await blockchain.call(
      new Operation(
        'my_game.update_player',
        playerInfo.toGTV(),
        crypto.randomBytes(32)
      ),
      user
    );
  } catch(error){
    console.log('Error updating player: ${error.message}');
    process.exit(1);
  }

  // get updated account details and print them to console
  userAccount = await blockchain.query('my_game.find_player_by_username', {
	username: playerInfo.username
  });
  console.log("STEP 5 RESULTS: " , userAccount);

  // STEP 7 - create weapon nfa
  try{
    await blockchain.call(
      new Operation(
        'my_game.create_weapon_nfa'
      ),
      user
    );
  } catch(error){
    console.log('Error creating weapon nfa: ${error.message}');
    process.exit(1);
  }

  console.log("STEP 7 COMPLETED");

  // STEP 8 - create weapon entitee
  let id = Math.floor(new Date() / 1000);
  let weaponInfo = new WeaponInfo(id, "Sword of a 1000 Truths", "sword", "legendary", 1000000, 9999);

  try{
    await blockchain.call(
      new Operation(
        'my_game.create_weapon_entitee',
        weaponInfo.toGTV(),
        user.authDescriptor
      ),
      user,
    );
  } catch(error){
    console.log('Error creating weapon entitee: ${error.message}');
    process.exit(1);
  }

  console.log("STEP 8 COMPLETED");

  // STEP 9 - search weapons owned by player
  try{
    let weapons = await blockchain.query('my_game.find_weapon_by_account_id', {
      account_id: userAccount.account_id.toString('hex')
    });

    if(weapons == null || weapons.length == 0){
      console.log('No weapons owned by player');
    }else{
      console.log(weapons);
    }
  } catch(error){
   console.log('Error looking up player weapons: ${error.message}');
   process.exit(1);
  }

  console.log("STEP 9 COMPLETED");

})()
