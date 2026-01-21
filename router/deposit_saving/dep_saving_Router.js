const { db_Select, saveRecord } = require('../../model/pgcommon');
const express = require('express'),
depsavingRouter = express.Router();


// create group code
const sahayikaCode = async (tenant_id) => {
  const select = `
    COALESCE(
      MAX(sahayika_id),
      '${tenant_id}' * 10000000
    ) + 1 AS sahayika_id
  `;
  const table_name = "bdccb.md_sahayika";
  const whr = `tenant_id = '${tenant_id}'`;
  const res_dt = await db_Select(select, table_name, whr, null);
  const sahayika_id_gen = res_dt.msg[0].sahayika_id;
  return sahayika_id_gen; // INTEGER
};

// fetch group details
depsavingRouter.get("/deposit_list", async (req, res) => {
    try{
        const tenant_id = parseInt(req.query.tenant_id || 0);
        const shg_id = parseInt(req.query.shg_id || 0);
        const sahayika_id = parseInt(req.query.sahayika_id || 0);
            // DIST ID AND BLOCK ID AND GP ID IS MANDATORY
                if (!shg_id || shg_id <= 0 || !tenant_id || tenant_id <= 0) {
                    return res.send({
                        success: false,
                        msg: "shg id and tenant id is required"
                    });
                }

      var select = "a.sahayika_id,a.tenant_id,a.dist_id,a.sahayika_name,a.phone_no,a.address,b.dist_name",
      table_name = "bdccb.md_sahayika a LEFT JOIN md_district b ON a.dist_id = b.dist_code",
      order = null;
      whr = `a.dist_id = '${dist_id}' AND a.tenant_id = '${tenant_id}'`,
      order = null;
      if(sahayika_id > 0){
        whr += ` AND a.sahayika_id = '${sahayika_id}'`;
      }
      var fetch_data = await db_Select(select,table_name,whr,order);

      if (fetch_data.suc === 1 && fetch_data.msg.length > 0) {
          return res.send({
            success: true,
            msg: "Sahayika List",
            data: fetch_data.msg
        });
        } else {
          return res.send({
            success: false,
            msg: "Failed to fetch Sahayika data"
          });
        }
    }catch(error){
      console.log("Error fetching group data:", error);
      return res.send({
        success: false,
        msg: "Internal server error",
        errorCode: "SERVER_ERROR"
      });
    }
});

// save / edit group
depsavingRouter.post("/save_sbacc", async (req, res) => {
    try {
      const {sb_id, tenant_id,shg_id,branch_id,acc_no,acc_opening_dt,balance,created_by,created_ip } = req.body;
      let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const table = "bdccb.td_deposit";
      const columns = sb_id > 0 ? ["tenant_id","shg_id","branch_id","acc_no","acc_opening_dt","balance","modified_by","modified_at","modified_ip"] : ["tenant_id","shg_id","branch_id","acc_no","acc_opening_dt","balance","created_by","created_at","created_ip"];
      const values = sb_id > 0 ? [tenant_id,shg_id,branch_id,acc_no,acc_opening_dt,balance,created_by,datetime,created_ip] : [tenant_id,shg_id,branch_id,acc_no,acc_opening_dt,balance,created_by,datetime,created_ip];
      const whereColumns = sb_id > 0 ? ["sb_id"] : [];
      const whereValues = sb_id > 0 ? [sb_id] : [];
      const flag = sb_id > 0 ? 1 : 0;
      const result = await saveRecord(table, columns, values,whereColumns,whereValues,flag);
      return res.send({
        success: true,
        msg: sb_id > 0 ? "Record Updated Successfully" : "Record Inserted Successfully",
        data: result.lastId
      });
      } catch (error) {
        console.error("Error in while save group:", error);
        return res.send({
        success: false,
        msg: "Internal server error",
        errorCode: "SERVER_ERROR"
       });
      }
});


module.exports = {depsavingRouter}