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

        const result = await pgdb.query(sql, values);
        console.log('Executed SQL:', sql, 'values:', values);
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

module.exports = { db_Select, saveRecord };