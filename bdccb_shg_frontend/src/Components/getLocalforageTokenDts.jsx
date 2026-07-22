import localforage from "localforage";
import { routePaths } from "../Assets/Data/Routes";

export const getLocalStoreTokenDts = async (navigate) => {
  try {
    
    const value = await localforage.getItem("tokenDetails");
    console.log("token_store_", value?.token);

    // if(value?.token && value?.expires_at){
    if(value?.token){

    } else {
      navigate(routePaths.LANDING)
			localStorage.clear()
    }

    return value; // return the token so it can be used wherever needed

  } catch (err) {
    console.error("Read error:", err);

    navigate(routePaths.LANDING)
    localStorage.clear()
    // navigate('/')
    return null;
  }
};



