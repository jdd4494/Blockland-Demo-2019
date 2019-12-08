# Blockland-Demo-2019

This demo is designed to introduce a developer to creating a backend in rell.  By the end of it, you should have a basic understanding on how to create, manipulate, and search databases.  This demo will also introduce Non Fungible Assets, and how they could be used inside of a game.

## Overview

The libraries found inside the directory: /rell/src/lib were provided by Chromaway and are not included in every default rell project. 

Inside this project you should see two main directories, config and src.  The config folder will contain a node-config.properties file. This file is used to determine the node settings that are configured when ran. Src should contain your rell code. The main.rell file located inside of src is the file that you will be selecting to run your entire node.

## Backend (Rell)

The following steps will walk you through creating player and weapon data structures on the blockchain.

### Setup / Installation

* Java 8+
* To be able to run a Postchain node: PostrgesSQL 10 http://www.postgresqltutorial.com/install-postgresql/
* (Recommended but optional) Rell Eclipse IDE https://www.chromia.dev/rell-eclipse/index.html

<b>This demo assumes you are using the eclipse IDE</b>

A great guide on how to get your environment setup:
https://rell.chromia.com/en/0.10.0/eclipse/eclipse.html

### Step 0

* Create a new file and call it player.rell inside of: rell/src/my_game.
* Create a second file and call it weapon.rell inside of: rell/src/my_game. 

### Step 1

<b>Inside of player.rell:</b>
* Create a player entity. This will be a table stored in the database that will contain your Player data

```
entity player {
	key account: ft3.acc.account;
	key username: text;
	mutable level: integer;
	mutable strength: integer;
	mutable speed: integer;
	mutable skill: integer;
}
```

### Step 2

<b>Inside of player.rell:</b>
* Create a player info struct. Structs are similar to entity classes, but are held temporarily in memory and not in the database

```
struct player_info{
	username: text;
	level: integer;
	strength: integer;
	speed: integer;
	skill: integer;
}
```

### Step 3

<b>Inside of player.rell:</b>
* Write an operation that will create a player and add it to the Player table

```
operation create_player(
	player_info,
	user_auth: ft3.acc.auth_descriptor
){
	
	// Creates account 
	val account_id = ft3.acc.create_account_with_auth(user_auth);
	val account = ft3.acc.account @ { account_id };
	
	// Call this to add data to player table
	create player(
		account = account,
		username = player_info.username,
		level = player_info.level,
		strength = player_info.strength,
		speed = player_info.speed,
		skill = player_info.skill
	);
}
```

### Step 4

<b>Inside of player.rell:</b>
* Write a query that will search the Player table for players by their username

```
query find_player_by_username(username: text){
	
	//  returns player object, zero or one, fails if more than one found
	var player = player @? { .username == username };
	
	// return null if null
	if(player == null){
		return null;
	}
	
	// return data
	return (
		username = player.username,
		level = player.level,
		strength = player.strength,
		speed = player.speed,
		skill = player.skill,
		account_id = player.account.id
	);
}
```

### Step 5

<b>Inside of player.rell:</b>
* Write an operation that will update a player's information in the Player table.
* <b>Note:</b> only <b>mutable</b> variables can be edited

```
operation update_player(
	player_info,
	nop: byte_array // required so data can be set to the same value more than once
){
	// TYPICALLY WILL WANT TO HAVE A LAYER OF AUTHENTICATION HERE TO PREVENT
	// ANYONE FROM ALTERING DATA, BUT OMITTED FROM DEMO DUE TO TIME
	
	// returns player object, exactly one, fails if zero or more than one found.
	var player = player @ { .username == player_info.username };
	
	// updates mutable data in the table
	player.level = player_info.level;
	player.strength = player_info.strength;
	player.speed = player_info.speed;
	player.skill = player_info.skill;
}
```

### Step 6

<b>Inside of weapon.rell:</b>
* Create a weapon info struct that will contain the weapon's data

```
struct weapon_info{
	id: integer;
	name: text;
	type: text;
	rarity: text;
	damage: integer;
	price: integer;
}
```
### Step 7

<b>Inside of weapon.rell:</b>
* Create the weapon NFA 

```
operation create_weapon_nfa(){
	val nameCompentStructure = nfa.c.createComponent('name', nfa.t.type.TEXT, ("weaponName").to_gtv());
	val typeCompentStructure = nfa.c.createComponent('type', nfa.t.type.TEXT, ("weaponType").to_gtv());
	val rarityCompentStructure = nfa.c.createComponent('rarity', nfa.t.type.TEXT, ("weaponRarity").to_gtv());
	var damageCompentStructure = nfa.c.createComponent('damage', nfa.t.type.INTEGER, [0, integer.MAX_VALUE].to_gtv());
	var priceCompentStructure = nfa.c.createComponent('price', nfa.t.type.INTEGER, [0, integer.MAX_VALUE].to_gtv());
	
	nfa.n.easyCreateNFA(
		"weapons",
		"Weapons For Game",
		integer.MAX_VALUE,
		map<name, (byte_array, boolean, boolean)>([
			"name": (nameCompentStructure.id, true, false),
			"type": (typeCompentStructure.id, true, false),
			"rarity": (rarityCompentStructure.id, true, false),
			"damage": (damageCompentStructure.id, true, false),
			"price": (priceCompentStructure.id, true, true)
		])
	);
}
```

### Step 8

<b>Inside of weapon.rell:</b>
* Create the weapon entitee.  In our example, weapons are a type of Non Fungible Asset. The actual weapon that we are creating is an entitee of that NFA.  The information about the weapon entitee are called properties.

```
operation create_weapon_entitee(
	weapon_info,
	user_auth: ft3.acc.auth_descriptor
){
	
	// searches for account based on the provided vault private/public key
	val account = ft3.acc.account @ { .id == user_auth.hash() };
	
	// in this example, the NFA can be a type of weapon (sword, spear, axe, etc)
	var nfa_weapon = nfa.n.nfa @ { .name == 'weapons' };
	
	val entityId = weapon_info.id;	
	val entitee = nfa.e.createEntitee(nfa_weapon, entityId.hash(), map<text, gtv>([
		"name": weapon_info.name.to_gtv(),
		"type": weapon_info.type.to_gtv(),
		"rarity": weapon_info.rarity.to_gtv(),
		"damage": weapon_info.damage.to_gtv(),
		"price": weapon_info.price.to_gtv()
	]));
	
	// set NFA Owner
	nfa.ft3.setOwner(entitee, account);
}
```

### Step 9

<b>Inside of weapon.rell:</b>
* Write a query that will allow us to lookup weapon NFAs owned by a player using their account id 

```
query find_weapon_by_account_id( account_id: byte_array ){
	
	// searches for account based on provided account id
	val account = ft3.acc.account @ { .id == account_id };
	
	// search through all NFA-weapons the player owns
	val nfas = nfa.ft3.ownership @* { .entitee.nfa.name == 'weapons', .account == account }(
		entitee = .entitee
	);
	
	// loop through results and return them
	val results = list<nfa.e.entity_description>();
	for(nfaWeapon in nfas){
		val en = nfa.e.getEntitee(nfaWeapon.entitee);		
		results.add(en);
	}
	
	return results;
}
```

## Front End (Javascript)

The following steps demonstrate how to communicate with the player and weapon data structures on the blockchain using javascript

### Setup / Installation

* Install Node JS

<b>windows:</b> https://www.guru99.com/download-install-node-js.html
<br>
<b>mac:</b> https://treehouse.github.io/installation-guides/mac/node-mac.html

* Install postchain-client: https://www.npmjs.com/package/postchain-client
* Install ft3-lib: https://www.npmjs.com/package/ft3-lib

### Step 0

* Import the correct packages and related scripts

```
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
```

### Step 1

* Create data classes that you will be passing into rell operations for creating a player and for a weapon

```
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
```

### Step 2

* Initialize a blockchain object. Blockchain class provides functions to call rell operations and queries.
* Create a dapp user. an instance of User object holds data needed to sign transaction and to interact with the ft3 lib

```
const blockchain = await Blockchain.initialize(
      Buffer.from(
        '0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF',
        'hex'
      ),
      new DirectoryService()
);
  
const keyPair = util.makeKeyPair();
const user = new User(
    keyPair,
    new SingleSignatureAuthDescriptor(
      keyPair.pubKey,
      [FlagsType.Account, FlagsType.Transfer]
    )
);
```

### Step 3

* Creates a new dapp account. The first parameter is the dapp user.  Call function uses keyPair property to sign the transaction.  The rest is passed into the create_player function

```
  let playerInfo = new PlayerInfo("player1", 1, 5, 10, 5);
  
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
```

### Step 4

* Get created account details by calling find_player_by_username query

```
  let userAccount = await blockchain.query('my_game.find_player_by_username', {
  	username: playerInfo.username
  });
```

### Step 5

* Update an existing player's data based on their username

```
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
```

### Step 6

* How to create weapon NFA type

```
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
```

### Step 7

* How to create weapon entitee (a unique weapon)

```
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
```

### Step 8

* How to lookup all the weapon entitees belonging to a player

```
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
```

