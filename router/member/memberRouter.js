const { db_Select, saveRecord } = require('../../model/pgcommon');
const express = require('express'),
memberRouter = express.Router();

// create member code

const memberCode = async (branch_id) => {

  const select = `
    COALESCE(MAX(SUBSTR(member_code::TEXT, 4)::INTEGER), 0) + 1 AS member_no
  `;

  const table = "bdccb.md_member";
  const res = await db_Select(select, table, null, null);

  const member_no = res.msg[0].member_no;

  const member_code = `${branch_id}${String(member_no).padStart(4, "0")}`;

  return member_code;
};

// fetch member details
memberRouter.post("/fetch_member_details", async (req, res) => {
 try{
  var data = req.body;

  var select = "a.member_code,a.member_name,b.branch_name",
  table_name = "bdccb.md_member a LEFT JOIN public.md_branch b ON a.branch_id = b.branch_id",
  whr = `a.branch_id = '${data.branch_code}' AND (a.member_name ILIKE '%${data.member_name}%' OR a.member_code::text ILIKE '%${data.member_name}%')`,
   order = null;
   var search_member_web = await db_Select(select,table_name,whr,order);

   if (search_member_web.suc !== 1 || search_member_web.msg.length === 0) {
      return res.send({
        success: true,
        msg: "No Member found",
        data: []
      });
    }

  var select = "a.member_code, a.branch_id, a.group_code, a.member_name, a.gender, a.dob, a.gurdian_name, a.tenant_id,a.address, a.phone_no, a.pin_no, a.aadhar_no, a.pan_no, a.voter_id, a.religion, a.caste, a.education, a.occupation,a.weaker_section,a.approval_status,b.branch_name,c.group_name,d.tenant_name",
  table_name = "bdccb.md_member a LEFT JOIN public.md_branch b ON a.branch_id = b.branch_id LEFT JOIN bdccb.md_group c ON a.group_code = c.group_code LEFT JOIN public.md_tenant d ON a.tenant_id = d.tenant_id",
  whr = `a.branch_id = '${data.branch_code}' AND a.member_code = '${data.member_name}'`,
  order = null;
  var fetch_member_web = await db_Select(select,table_name,whr,order);
 
  if (fetch_member_web.suc === 1 && fetch_member_web.msg.length > 0) {
      return res.send({
        success: true,
        msg: "Member List",
        data: fetch_member_web.msg
    });
    } else {
      return res.send({
        success: true,
        msg: "Failed to fetch member data",
        data: []
      });
    }
 }catch(error){
   console.log("Error fetching member data:", error);
   return res.send({
    success: false,
    msg: "Internal server error",
    errorCode: "SERVER_ERROR"
   });
 }
});

// save / edit member details 

memberRouter.post("/save_member", async (req, res) => {
     try {
        const { member_code, branch_id, group_code, member_name, gender, dob, gurdian_name, tenant_id, address, phone_no, pin_no, aadhar_no, pan_no, voter_id, religion, caste, education, occupation, weaker_section,created_by,ip_address } = req.body;
        console.log(req.body,'member');

        // GENDER VALIDATION
        if (!["M", "F", "O"].includes(gender)) {
          return res.send({
            success: true,
            msg: "Invalid gender value",
            data: []
          });
        }

        let dobInput = dob;
        if (dobInput === "") {
          dobInput = null;
        }
        // DOB VALIDATION
               let dobValue = null;

        if (dobInput) {
          const d = new Date(dobInput);
          if (isNaN(d)) {
            return res.send({
              success: true,
              msg: "Invalid date of birth",
            data: []
            });
          }
          dobValue = d.toISOString().slice(0, 10);
        }

        // PHONE VALIDATION
        if (phone_no) {
          const phoneStr = phone_no.toString().trim();
          if (!/^[6-9]\d{9}$/.test(phoneStr)) {
            return res.send({
              success: true,
              msg: "Phone number must be a valid 10-digit mobile number",
              data: []
            });
          }
        }

        // PIN VALIDATION
        if (pin_no && !/^\d{6}$/.test(pin_no)) {
          return res.send({
            success: true,
            msg: "Invalid PIN code",
            data: []
          });
        }

        // AADHAR VALIDATION (optional)
        if (aadhar_no && !/^\d{12}$/.test(aadhar_no)) {
          return res.send({
            success: true,
            msg: "Invalid Aadhar number",
            data: []
          });
        }

        let datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');

        let mem_code = null;
        if (!member_code) {
        mem_code = await memberCode(branch_id); 
        }

      const table = "bdccb.md_member";
      const columns = member_code > 0 ? ["branch_id","group_code","member_name","gender","dob","gurdian_name","tenant_id","address","phone_no","pin_no","aadhar_no","pan_no","voter_id","religion","caste","education","occupation","weaker_section","modified_by","modified_at","ip_address"] : ["member_code","branch_id","group_code","member_name","gender","dob","gurdian_name","tenant_id","address","phone_no","pin_no","aadhar_no","pan_no","voter_id","religion","caste","education","occupation","weaker_section","delete_flag","approval_status","created_by","created_at","ip_address"];
      const values = member_code > 0 ? [branch_id,group_code,member_name || null,gender,dobValue,gurdian_name,tenant_id,address,phone_no,pin_no,aadhar_no,pan_no,voter_id,religion,caste,education,occupation,weaker_section,created_by,datetime,ip_address] : [mem_code,branch_id,group_code,member_name || null,gender,dobValue,gurdian_name,tenant_id,address,phone_no,pin_no,aadhar_no,pan_no,voter_id,religion,caste,education,occupation,weaker_section,'N','U',created_by,datetime,ip_address];
      const whereColumns = member_code > 0 ? ["member_code"] : [];
      const whereValues = member_code > 0 ? [member_code] : [];
      const flag = member_code > 0 ? 1 : 0;
      const result_member = await saveRecord(table, columns, values,whereColumns,whereValues,flag);

      if (!result_member || result_member.suc !== 1) {
        return res.send({
          success: true,
          msg: result_member.msg || "Failed to save member",
          data: []
        });
      }

      return res.send({
        success: true,
        msg: member_code > 0 ? "Record Updated Successfully" : "Record Inserted Successfully",
      });
     }catch (error){
         console.error("Error in while save member:", error);
        return res.send({
        success: false,
        msg: "Internal server error",
        errorCode: "SERVER_ERROR"
       });
     }
});

module.exports = {memberRouter}