/**
 * Character route handler
 */

const express = require('express');
const sql = require('mssql');
const config = require('config');

const router = express.Router();

sql.on('error', err => {
  console.log(err);
});

router.get('/', (req, res, next) => {
  sql.connect(config.get('database')).then(pool => {
    return pool.request()
      .input('UserNum', sql.Int, req.user.UserNum)
      .query(`SELECT CharacterIdx, Name, LEV, (Style / 1 & 7) AS Class, Nation
        FROM Server01.dbo.cabal_character_table WHERE CharacterIdx BETWEEN @UserNum * 8 AND @UserNum * 8 + 5`);
  }).then(result => {
    res.json({
      characters: result.recordset,
    });
  }).catch(next);
});

router.get('/:id', (req, res, next) => {
  sql.connect(config.get('database')).then(pool => {
    return pool.request()
      .input('CharacterIdx', sql.Int, req.params.id)
      .input('UserNum', sql.Int, req.user.UserNum)
      .query(`SELECT CharacterIdx, Name, LEV, (Style / 1 & 7) AS Class, ((Style % 256) / 8) AS ClassRank, EXP, STR, INT, DEX, PNT, Alz, PlayTime, Nation
        FROM Server01.dbo.cabal_character_table WHERE CharacterIdx BETWEEN @UserNum * 8 AND @UserNum * 8 + 5 AND CharacterIdx = @CharacterIdx`);
  }).then(result => {
    if (result.recordset && result.recordset.length !== 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({
        errors: [{
          msg: 'Character not found',
        }],
      });
    }
  }).catch(next);
});

module.exports = router;
