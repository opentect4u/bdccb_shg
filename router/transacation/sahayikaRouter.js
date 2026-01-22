const { db_Select, saveRecord } = require('../../model/pgcommon');
const express = require('express'),
sahayikaRouter = express.Router();


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
sahayikaRouter.get("/sahayika_list", async (req, res) => {
    try{
        const tenant_id = parseInt(req.query.tenant_id || 0);
        const dist_id = parseInt(req.query.dist_id || 0);
        const sahayika_id = parseInt(req.query.sahayika_id || 0);
            // DIST ID AND BLOCK ID AND GP ID IS MANDATORY
                if (!tenant_id || tenant_id <= 0) {
                    return res.send({
                        success: false,
                        msg: "tenant id is required"
                    });
                }

      var select = "a.sahayika_id,a.tenant_id,a.dist_id,a.sahayika_name,a.phone_no,a.address,b.dist_name",
      table_name = "bdccb.md_sahayika a LEFT JOIN md_district b ON a.dist_id = b.dist_code",
      order = null;
      whr = `a.tenant_id = '${tenant_id}'`,
      order = null;
      if(sahayika_id > 0){
        whr += ` AND a.sahayika_id = '${sahayika_id}'`;
      }
      if(dist_id > 0){
        whr += ` AND a.dist_id = '${dist_id}'`;
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
            msg: "Failed to fetch Sahayika data",
            data: []
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
sahayikaRouter.post("/save_sahayika", async (req, res) => {
    try {
      const { sahayika_id,tenant_id,branch_id,dist_id,sahayika_name,phone_no,address,created_by,ip_address } = req.body;
      let sahayika_gen_id = 0;
      let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      if(sahayika_id == 0){
          sahayika_gen_id = await sahayikaCode(tenant_id);
      }else{
          sahayika_gen_id = sahayika_id;
      }
      const table = "bdccb.md_sahayika";
      const columns = sahayika_id > 0 ? ["tenant_id","branch_id","dist_id","sahayika_name","phone_no","address","modified_by","modified_at","ip_address"] : ["sahayika_id","tenant_id","branch_id","dist_id","sahayika_name","phone_no","address","created_by","created_at","ip_address"];
      const values = sahayika_id > 0 ? [tenant_id,branch_id,dist_id,sahayika_name,phone_no,address,created_by,datetime,ip_address] : [sahayika_gen_id,tenant_id,branch_id,dist_id,sahayika_name,phone_no,address,created_by,datetime,ip_address];
      const whereColumns = sahayika_id > 0 ? ["sahayika_id"] : [];
      const whereValues = sahayika_id > 0 ? [sahayika_id] : [];
      const flag = sahayika_id > 0 ? 1 : 0;
      const result = await saveRecord(table, columns, values,whereColumns,whereValues,flag);
      return res.send({
        success: true,
        msg: sahayika_id > 0 ? "Record Updated Successfully" : "Record Inserted Successfully",
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


module.exports = {sahayikaRouter}