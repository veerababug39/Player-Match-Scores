const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//GET All Player Details

app.get("/players/", async (request, response) => {
  const getPlayerDetailsQuery = `
    SELECT
        *
    FROM 
        player_details;`;
  const playerDetails = await db.all(getPlayerDetailsQuery);
  response.send(
    playerDetails.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

//Get Specific Player Details

app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const GetPlayerDetailsQuery = `
    SELECT 
        *
    FROM 
        player_details
    WHERE 
        player_id = ${playerId};`;
  const player = await db.get(GetPlayerDetailsQuery);
  response.send(convertPlayerDbObjectToResponseObject(player));
});

//Update player Details

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlyerQuery = `
    UPDATE
        player_details
    SET
        player_name = '${playerName}'
    WHERE 
        player_id = ${playerId};`;
  await db.run(updatePlyerQuery);
  response.send("Player Details Updated");
});

//Get Player Match Details

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerMatchDetails = `
    SELECT
        *
    FROM
        match_details
    WHERE
        match_id = ${matchId};`;
  const matchDetails = await db.get(getPlayerMatchDetails);
  response.send(convertMatchDbObjectToResponseObject(matchDetails));
});

//Get All Player Match Details

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getAllPlayerMatchDetailsQuery = `
    SELECT
        *
    FROM
        player_match_score
    NATURAL JOIN match_details
    WHERE
        player_id = ${playerId};`;
  const allPlayerMatchDetails = await db.all(getAllPlayerMatchDetailsQuery);
  response.send(
    allPlayerMatchDetails.map((eachMatch) =>
      convertMatchDbObjectToResponseObject(eachMatch)
    )
  );
});

//Get Specific Match Player Details

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerDetailsQuery = `
    SELECT
        *
    FROM 
        player_match_score
    NATURAL JOIN player_details
    WHERE
        match_id = ${matchId};`;
  const players = await db.all(getMatchPlayerDetailsQuery);
  response.send(
    players.map((eachPlayerMatch) =>
      convertPlayerDbObjectToResponseObject(eachPlayerMatch)
    )
  );
});

//Get Players Scores

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const playersScoresQuery = `
    SELECT 
        player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM 
        player_match_score
    NATURAL JOIN player_details
    WHERE 
        player_id = ${playerId};`;
  const playersScores = await db.get(playersScoresQuery);
  response.send(playersScores);
});

module.exports = app;
