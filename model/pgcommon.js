pgdb = require("../db/pgdb");

  const db_Select = async (columns,table,where = null,orderBy = '',limit = null,offset = null) => {
      try {
        let sql = `SELECT ${columns} FROM ${table}`;
        const values = [];
        let idx = 1; // PostgreSQL param index

        if (where) {
          sql += ` WHERE ${where}`;
        }

        if (orderBy) {
          sql += ` ORDER BY ${orderBy}`;
        }

        if (limit !== null) {
          sql += ` LIMIT $${idx++}`;
          values.push(Number(limit));
        }

        if (offset !== null) {
          sql += ` OFFSET $${idx++}`;
          values.push(Number(offset));
        }
       console.log('Executed SQL:', sql, 'values:', values);
        const result = await pgdb.query(sql, values);
       
        return { suc: 1, msg: result.rows };

      } catch (err) {
        console.error('DB Error:', err);
        return { suc: 0, msg: err.message };
      }
  };

  const saveRecord = async (table,columns,values,whereColumns = [],whereValues = [],flag = 0) => {
    // -------- Safety checks --------
    if (!Array.isArray(columns) || !Array.isArray(values)) {
      throw new Error("columns and values must be arrays");
    }

    if (columns.length !== values.length) {
      throw new Error("columns and values length mismatch");
    }

    if (flag === 1) {
      if (!Array.isArray(whereColumns) || !Array.isArray(whereValues)) {
        throw new Error("whereColumns and whereValues must be arrays for update");
      }

      if (whereColumns.length !== whereValues.length) {
        throw new Error("whereColumns and whereValues length mismatch");
      }
    }

    let sql = '';
    let params = [];

    // -------- INSERT --------
    if (flag === 0) {
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

      sql = `
        INSERT INTO ${table} (${columns.join(", ")})
        VALUES (${placeholders})
        RETURNING *;
      `;

      params = values;
    }

    // -------- UPDATE --------
    if (flag === 1) {
      const setClause = columns
        .map((col, i) => `${col} = $${i + 1}`)
        .join(", ");

      const whereClause = whereColumns
        .map((col, i) => `${col} = $${columns.length + i + 1}`)
        .join(" AND ");

      sql = `
        UPDATE ${table}
        SET ${setClause}
        WHERE ${whereClause}
        RETURNING *;
      `;

      params = [...values, ...whereValues];
    }

    // console.log("Executed SQL:", sql);
    // console.log("Values:", params);

    try {
          const result = await pgdb.query(sql, params);
          let data = {};
          // console.log('Save Record Result:', sql, params);
          if (flag === 0) {
              if (result.rows[0]) {
                const row = result.rows[0];
                // try to find a column name containing "id"
                const idColumn = Object.keys(row).find(col => col.toLowerCase().endsWith('_id'));
                if (idColumn) lastId = row[idColumn];
              }
            // INSERT
            data = {
              suc: 1,
              msg: 'Insert successfully',
              lastId:lastId
            };
          } else {
            // UPDATE
            data = {
              suc: 1,
              msg: 'Update successfully',
              lastId: result.rowCount || null
            };
          }
          return data;

        } catch (err) {
          console.error(err);
          return {
            suc: 0,
            msg: err.message
          };
        }
  };

  const deposit_balance_update = async (sb_id, amount, dep_with_flag) => {
    try {
      const balance_update_query = `UPDATE bdccb.td_deposit SET balance = balance + ${dep_with_flag === 'W' ? -amount : amount} WHERE sb_id = ${sb_id}`;
      await pgdb.query(balance_update_query);
    } catch (err) {
      console.error("Error updating deposit balance:", err);
      throw err;
    }
  }
  const get_pacs_of_branch = async (branch_id) => {
            try{
                const  query =`SELECT string_agg(a.branch_id::text, ',') AS branch_ids
                                FROM md_branch a
                                WHERE a.branch_jurisdiction_id = ${branch_id};`;
                const result = await pgdb.query(query)
                return result.rows[0].branch_ids || '';                 

            }catch(err){
                console.error("Error fetching PACS of branch:", err);
                throw err;
            }

  }
  const deleteRecord = async (table, whereCols, whereVals) => {

  let where = whereCols
    .map(col => `${col} = ?`)
    .join(" AND ");

  let sql = `DELETE FROM ${table} WHERE ${where}`;

  await db.query(sql, whereVals);
};


module.exports = { db_Select, saveRecord, deleteRecord,deposit_balance_update,get_pacs_of_branch };