# Blockland-Demo-2019

This demo is designed to introduce a developer to creating backend in rell.  By the end of it, you should have a basic understanding on how to create, manipulate, and search databases.  This demo will also introduce Non Fungible Assets, and how they could be used inside of a game.

## Prerequisites

* Java 8+
* To be able to run a Postchain node: PostresSQL 10
* (Recommended but optional) Rell Eclipse IDE https://www.chromia.dev/rell-eclipse/index.html

<b>This demo assumes you are using the eclipse IDE</b>

A great guide on how to get your environment setup:
https://rell.chromia.com/en/0.10.0/eclipse/eclipse.html

## Overview

In this demo project, we have created a few base libraries and namespaces due to time constraints. The libraries found inside the directory: /rell/src/lib were provided by Chromaway and are not included in every default rell project. 

Inside this project you should see two main directories, config and src.  The config folder will contain a node-config.properties file. This file is used to determine the node settings that are configured when ran. Src should contain your rell code. The main.rell file located inside of src is the file that you will be selecting to run your entire node.

## Step 0

* Create a new file and call it player.rell inside of: rell/src/my_game.
* Create a second file and call it weapon.rell inside of: rell/src/my_game. 

## Step 1

Inside of player.rell:
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

## Step 2

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

## Step 3

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

## Step 4

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

## Step 5

* Write an operation that will update a player's information in the Player table <br>Note:</br> only <br>mutable</br> variables can be edited

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

## Step 6


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

## Step 7

```
operation create_weapon(
	weapon_info
){
	// in this example, the NFA can be a type of weapon (sword, spear, axe, etc)
	var nfa_weapon = nfa.n.nfa @? { .name == 'weapons' };
	
	// TODO CREATE WEAPONS
	// TODO PASS OWNERSHIP OF WEAPON TO USER
}
```

## Step 8


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
