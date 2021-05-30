import React, {useState} from "react";
import './App.css';
import Amplify,{Storage,API,Auth} from 'aws-amplify';
import { AmplifyAuthenticator,AmplifySignOut,AmplifySignUp,AmplifySignIn} from '@aws-amplify/ui-react';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import awsconfig from './aws-exports';



Amplify.configure(awsconfig);


function Query() {
    const [inputList, setInputList] = useState([{ tagValue : "" }]);
    const [resultData, setResultData] = useState([]);
    
    // add tags
    const [addTagsList, setAddTagsList] = useState([{ tagValue : "" }]);
    const [imageUrl, setImageUrl] = useState('');
    const [resultInfo, setResultInfo] = useState();
    // upload the image to S3
    const [uploadProgress,setUpLoadProcess] = useState('getUpload');
    const[uploadImage,setUpLoadImage] = useState();
    // get the error message
    const[errorInfor,setErrorInfor]  = useState();

    const [deleteImageUrl, setDeleteImageUrl] = useState('');

     // upload 
     const upload = async() =>{
      
      // put the image to the storage and add the image name with date 
      // it uses the Asynchronous method to upload the image 
      await Storage.put(`${Date.now()}.jpg`,uploadImage,{contentType:'image/jpg'});
      setUpLoadProcess('finishUpload')
    }

    // upload the image to the S3
    const uploadImages = () =>{
      switch(uploadProgress){
        case 'getUpload':
          return(
            <>
            <input type="file" accept = "image/*" onChange={e=>setUpLoadImage(e.target.files[0])}/>
            <button onClick={upload}>Upload Iamge</button>
            </>
          )
        case 'finishUpload':
            return(
          <>
            <div>Successfully upload your Image</div>
            <input type="file" accept = "image/*" onChange={e=>setUpLoadImage(e.target.files[0])}/>
            <button onClick={upload}>Upload Iamge</button>
            </>)
        case 'failureUpload':
          return(
            <>
              <div>Error Infromation = {errorInfor}</div>
              <input type="file" accept = "image/*" onChange={e=>setUpLoadImage(e.target.files[0])}/>
              <button onClick={upload}>Upload Iamge</button>
              </>)
        default:
          break;

      }
    }


    // handle input change
    const handleInputChange = (e, index) => {
        const { value } = e.target;
        const list = [...inputList];
        list[index]["tagValue"] = value;
        setInputList(list);
    };

    // handle click event of the Remove button
    const handleRemoveClick = index => {
        const list = [...inputList];
        list.splice(index, 1);
        setInputList(list);
    };

    // handle click event of the Add button
    const handleAddClick = () => {
        setInputList([...inputList, { tagValue: "" }]);
    };

    // // handle url 
    // const handleImageUrlChange = (e) => {
    //     const { value } = e.target;
    //     setImageUrl(value);
    // };

    // add Tags
    // handle input change
    const handleAddTagsChange = (e, index) => {
        const { value } = e.target;
        const list = [...addTagsList];
        list[index]["tagValue"] = value;
        setAddTagsList(list);
    };

    // handle click event of the Remove button
    const handleRemoveTagsClick = index => {
        const list = [...addTagsList];
        list.splice(index, 1);
        setAddTagsList(list);
    };

    // handle click event of the Add button
    const handleAddTagsClick = () => {
        setAddTagsList([...addTagsList, { tagValue: "" }]);
    };

    async function callApi() {
        try {
            let tagsList = {};
            let list = [];
            for (let i = 0; i<inputList.length; i++){
                if (!inputList[i]["tagValue"].length <= 0) {
                    // tagsList["tag".concat(i + 1)] = inputList[i]["tagValue"];
                    list.push(inputList[i]["tagValue"]);
                }
            }
            // tag list user input
            tagsList["tags"] = list;
            // tagsList["tags"] = ["person"];

            console.log("*****");
            console.log(tagsList);

            await API.get('imageRetrieveApi', '/items', {
                // headers: {
                //     Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
                // },
                'queryStringParameters': tagsList
            }).then(
              (result) =>{
                  setResultData(result["links"])
              }
          );
            
        } catch (err) {
            console.log({err})
        }
    }

    //Api for delete Image
    async function callApiForDeleteImage(){
        
        try {
            let tagsList = {};
            // tag list user input
            tagsList["url"] = deleteImageUrl;
            // delete the image from the dynamoDB
            await API.del('imageRetrieveApi', '/items', {
                // headers: {
                //     Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
                // },
                'queryStringParameters': tagsList
            }).then(
              (result) =>{
                setResultData(result["result"])
              }
          );

            const temporyImageName = deleteImageUrl.split('/');
            const imageName = temporyImageName[temporyImageName.length -1];

            console.log("**********")
            console.log(imageName);
            console.log("**********")

            // delete the image from S3
            Storage.remove(imageName,{level: 'public'});

            
        } catch (err) {
            console.log({err})
        }
    }


    // Api for add tags
    async function callApiForAddTags() {
        try {
            let tagsList = {};
            let list = [];
            for (let i = 0; i<addTagsList.length; i++){
                if (!addTagsList[i]["tagValue"].length <= 0) {
                    // tagsList["tag".concat(i + 1)] = inputList[i]["tagValue"];
                    list.push(addTagsList[i]["tagValue"]);
                }
            }
            // tag list user input
            tagsList["url"] = imageUrl;
            tagsList["tags"] = list;
            // tagsList["tags"] = ["person"];

            console.log("*****");
            console.log(tagsList);

            await API.put('imageRetrieveApi', '/items', {
                // headers: {
                //     Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
                // },
                'queryStringParameters': tagsList
            }).then(
              (result) =>{
                  setResultData(result["result"])
              }
          );
            
        } catch (err) {
            console.log({err})
        }
    }

    return (
        <AmplifyAuthenticator usernameAlias="email" initialAuthState="signup">
            <AmplifySignUp
                slot="sign-up"
                usernameAlias="email"
                formFields={[
                    {
                        type: "email",
                        label: "Email Address",
                        placeholder: "custom email placeholder",
                        required: true,
                    },
                    {
                        type: "password",
                        label: "Password",
                        placeholder: "custom password placeholder",
                        required: true,
                    },
                    {
                        type: "family_name",
                        label: "Family Name",
                        placeholder: "custom password placeholder",
                        required: true,
                    },
                    {
                        type: "given_name",
                        label: "Given Name",
                        placeholder: "custom password placeholder",
                        required: true,
                    },
                ]}
            />
            <AmplifySignIn  slot="sign-in" usernameAlias="email" />



            <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css"></link>
                <div className="Upload-Retrieve" style = {{alignItems:"center"}}>
                    <h3>Upload images</h3>
                    <div>{uploadImages()}</div>
                        <h4>Retrieve images:</h4>
                        {inputList.map((x, i) => {
                            return (
                                <div>
                                    <input
                                        placeholder="Enter tag value"
                                        value={x.tagValue}
                                        onChange={e => handleInputChange(e, i)}
                                    />
                                    <div>
                                        {inputList.length !== 1 && <button
                                            class = "w3-button w3-round w3-small w3-red"
                                            onClick={() => handleRemoveClick(i)}>Remove</button>}
                                        {inputList.length - 1 === i && <button class = "w3-button w3-round w3-small w3-blue" onClick={handleAddClick}>Add</button>}
                                    </div>
                                </div>
                            );
                        })}
                        <div style={{ marginTop: 20 }}>{JSON.stringify(inputList)}</div>
                        <button class = "w3-button w3-round w3-small w3-blue" onClick={callApi}>Submit</button>

                        

                        <h4>Add tags:</h4>
                        <div>
                            <input 
                                placeholder="Enter image url"
                                value={imageUrl}
                                onChange={e => setImageUrl(e.target.value)}
                            />
                        </div>
                            {addTagsList.map((x, i) => {
                                return (
                                    <div style={{ marginTop: 20 }} >
                                        <input
                                            placeholder="Enter tag value"
                                            value={x.tagValue}
                                            onChange={e => handleAddTagsChange(e, i)}
                                        />
                                        <div>
                                            {addTagsList.length !== 1 && <button
                                                className="mr10"
                                                onClick={() => handleRemoveTagsClick(i)}>Remove</button>}
                                            {addTagsList.length - 1 === i && <button class = "w3-button w3-round w3-small w3-blue" onClick={handleAddTagsClick}>Add</button>}
                                        </div>
                                    </div>
                                );
                            })}
                            <div style={{ marginTop: 20 }}>{JSON.stringify(addTagsList)}</div>
                            <button class = "w3-button w3-round w3-small w3-blue" onClick={callApiForAddTags}>Add tag</button>
                            <h4 style ={{textAlign : "center"}}>{resultInfo}</h4>

                            

                            <h4>Remove images:</h4>
                            <div>
                                <input 
                                    placeholder="Enter image url"
                                    value={deleteImageUrl}
                                    onChange={e => setDeleteImageUrl(e.target.value)}
                                />
                            </div>
                            <button class = "w3-button w3-round w3-small w3-red" onClick={callApiForDeleteImage}>Delete</button>
                            <h4 style ={{textAlign : "center"}}>{resultInfo}</h4>

                            <h3 style={{color:"red", textAlign : "center"}}>Results:</h3>
                            <div>
                                {resultData.map((x, i) => {
                                    return (
                                        <div className="box">
                                            {x}
                                        </div>
                                    );
                                })}
                            </div>
                            
                </div>
           
                



            <AmplifySignOut/>
        </AmplifyAuthenticator>

    )
}





export default Query;