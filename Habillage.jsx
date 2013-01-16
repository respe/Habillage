var params = {"isYoutube":false,
                "isBeta":false,
                "isFolder":true,
                "autoStartRender":true};


/**  ----------------------------------------------------------------------------------------------------------------------------------------------------------
*   HABILLAGE
*
*/
function Habillage(thisObj)
{
    var data =  [{"url":"",
                "name":"",
                "city":"",
                "region":"",
                "country":"",
                "date":"",
                "hour":""
                "degree":""}];

    var inputFolder = new Folder('//CSV_BACKUP/main_raid5/CSV/Render/_Speed MOV');
    var index = 0;
    var files;
    var filesLength = 0;

    var textFile = new File('//CSV_BACKUP/main_raid5/CSV/Data/CSV Data - Feuille1.csv');

    this.function = start(params)
    {
        if(params.isFolder){
            // Process Folder
            
            inputFolder = inputFolder.selectDlg("Import items from folder...");
            files = inputFolder.getFiles('*.mov');
            filesLength = files.length;

            for(var i = 0; i < filesLength; i++)
            {
                data = getData(files[i]);
                habillage = HabillageProcess(files[i], data);
            }
        }else{
            habillage = HabillageProcess(files[i], data);// SI UNIQUE
        }
    }

    function nextFile(){
        index ++;
        data = getData(files[index]);
        HabillageProcess(files[index], data);
    }

    function getData(file, textFile){
        var ID = file.name.split("_")[2];
        var exp = new RegExp (','+ID+',.*(\r|\n)', 'g');

        textFile.open('r');
        var text = textFile.read();  

        var line = exp.exec(text).toString();
        var textCell = line.split(",");
        
        var data =  [{"ID":"",
                        "url":"",
                        "name":"",
                        "city":"",
                        "region":"",
                        "country":"",
                        "date":"",
                        "hour":""
                        "degree":""}];

        data.ID = ID;
        data.url = textCell[2].slice(7);
        data.name = textCell[3];
        data.city = textCell[4];
        data.region =  textCell[5];
        data.country =  textCell[6];
        data.date = textCell[7];
        data.hour = textCell[8];
        data.degree = textCell[9];
        
        var t = textCell[10].split('.');
        data.sampleTime = Number(t[0])*60+Number(t[1]); // convert minutes.secondes en secondes

        return data;
    }

    /**
    *
    *
    */
    function HabillageProcess(data)
    {
        var comp = app.project.item(1);
        var ending = comp.layer(1).source;
        var synth = comp.layer(2).source;
        var titre = comp.layer(3).source;

        var compYoutube = app.project.item(2);        


        //$.writeln(file.name);
        var file;

        if(params.isFolder){
            file = pFile;
        }else{
            file = File.openDialog();// SI UNIQUE
        }

        // import footage
        var importOptions = new ImportOptions(file);
        var footage = app.project.importFile(importOptions);

        var videoLayer = comp.layer(5);

        var outputFileName;

        //var footage = app.project.item(8);
        var ID = footage.name.split("_")[2];
        var part = footage.name.slice(-5,-4);

        
        setText(data);

        setVideo();
        arrangeComp();

        fadeAudio();
        render();

        function setText(data){
            //
            outputFileName = ID+"_"+name+"_"+city+"_"+region+"_"+country;
            
            if(isMultiPart){
                if(part == 1) url = "More : "+url+"1";
                titre.layer(2).property("sourceText").setValue("Part "+part+"\n"+city+" - "+region);
                outputFileName = ID+"_"+name+"_"+city+"_"+region+"_"+country+"_Part"+part;
            }
            
            titre.layer(1).property("sourceText").setValue(name);
            var titreHeight = getTextHeight(titre.layer(1));
            titreY =  (titreHeight > 60)?486:400;
            titre.layer(1).position.setValue([640, titreY]);
            
            titre.layer(2).property("sourceText").setValue(city+" - "+region);
            titre.layer(3).property("sourceText").setValue(date+" - "+hour+" - "+degree);
            
            synth.layer(1).property("sourceText").setValue(date+"\n"+hour+" - "+degree);
            
            ending.layer(1).property("sourceText").setValue(url);
            compYoutube.layer(6).property("sourceText").setValue(url);
            
            if(sampleTime)
                setYtSartTime(-sampleTime);
        }

        this.arrangeComp  =function(){
                arrangeComp();
        }
        this.fadeAudio  =function(){
                fadeAudio();
        }


        function getTextHeight(textLayer){
            textLayer.containingComp.openInViewer();
            textLayer.selected = true;
            // store initial transforms
            var initialPosition = textLayer.position.value;
            var initialScale = textLayer.scale.value;

            // fit to comp height and store new y-scale
            var cmd_US = "Fit to Comp Height";
            var cmd_FR = "Ajuster à la hauteur de la composition";
            app.executeCommand(app.findMenuCommandId(cmd_FR));
            var modifiedYScale = textLayer.scale.value[1];    

            // compute text size
            var textHeight = initialScale[1] * comp.height / modifiedYScale;
$.writeln('textHeight : '+textHeight);
            // reset transforms to their initial values
            textLayer.position.setValue(initialPosition);
            textLayer.scale.setValue(initialScale);
            
            return textHeight;
        }

        function setVideo(){
            videoLayer.replaceSource(footage, false);
            videoLayer.outPoint = 10800; // 10800 = valeur max
            compYoutube.layer(5).source.layer(1).replaceSource(footage, false);
        }

        function fadeAudio(){
            var audioLevel = videoLayer.Audio.audioLevels;
            // remove key
            audioLevel.removeKey(4);
            audioLevel.removeKey(3);
            // add new key
            var v=videoLayer.outPoint-(7/30);
            audioLevel.setValueAtTime(v, [0, 0]);
            audioLevel.setValueAtTime(videoLayer.outPoint, [-48,-48]);
        }

        function moveKey(prop, keyIndex, newTime, value){
            var keyVal = prop.keyValue(keyIndex);
            prop.removeKey(keyIndex);
            prop.setValueAtTime(newTime, value||keyVal);
        }
        
        function arrangeComp(){
            var opacity = comp.layer(2).opacity;
            // remove key
            opacity.removeKey(4);
            opacity.removeKey(3);
            // add new key
            opacity.setValueAtTime(videoLayer.outPoint-1, 100);
            opacity.setValueAtTime(videoLayer.outPoint-(16/30), 0);
            
            // Ajoute fin
            comp.layer(1).startTime = (videoLayer.outPoint - (16/30)); // -16 images
            
            // Definit durée zone de travail
             comp.workAreaDuration = comp.layer(1).outPoint;
            
            // Ajoute musique intro
            var r = Math.floor(Math.random()*4)+4; // 4-5-6-7
            randomSong = app.project.item(r);
            comp.layer(6).replaceSource(randomSong, false);
        }

        function setYtSartTime(value){
                compYoutube.layer(5).source.layer(1).startTime = value-0.7;
        }

        function arrangeYtComp(){
                
        }

        function render(){
            //Lancer le rendu
            myRenderQueue = app.project.renderQueue;

            if(params.isYoutube){
                myQueueItem2 = myRenderQueue.items.add(compYoutube);
                myOM2 = myQueueItem2.outputModule(1);
                myOM2.applyTemplate("CSV-youtube");
                myOM2.file = new File("F:/4-Teaser/"+outputFileName+"_teaser.mov");
            }else if(params.isBeta){
                myQueueItem = myRenderQueue.items.add(comp);
                myOM = myQueueItem.outputModule(1);
                myOM.applyTemplate("CSV-qt-png");
                myOM.file = new File("G:/1-Final Habillage/"+outputFileName+"_Beta.mov");    
            }else{
                myQueueItem = myRenderQueue.items.add(comp);
                myOM = myQueueItem.outputModule(1);
                myOM.applyTemplate("CSV-qt-png");
                myOM.file = new File("G:/5-Final Habillage/"+outputFileName+".mov");    
            }
        
            if(params.autoStartRender){
                myRenderQueue.render();
                if(fileList.length > index){
                    onRenderComplete();
                }
            }
        }

        return this;
    }

}


var habillage = Habillage(this);













//move file to Done folder
//var destFile = new File("/F/Habillage/Done/"+file.name);
//var cmd = "cmd.exe /c \"move \""+file.fsName+"\" \""+destFile.fsName+"\"\"";
//system.callSystem(cmd);

//file = destFile;

//var cmd = "cmd.exe /c \"move \""+myOM.file.fsName+"\" \"/G/"+outputFileName+"_Beta-test.mov\"\"";
//system.callSystem(cmd);

 //move file to Process folder
 /*
var destFile = new File("/F/Habillage/Process/"+file.name);
 $.writeln(destFile.fsName);
var cmd = "cmd.exe /c \"move \""+file.fsName+"\" \""+destFile.fsName+"\"\"";
system.callSystem(cmd);

file = destFile;
*/
function temp(){
                /**  ----------------------------------------------------------------------------------------------------------------------------------------------------------
                    *   PALETTE
                    *
                    */
                    function Palette(thisObj)
                    {

                        // This function adds a new script-launching button to the palette
                        function addButton(palette, buttonRect, buttonLabel, buttonFunctionName)
                        {
                            var newButton = palette.add("button", buttonRect, buttonLabel);

                            newButton.onClick = buttonFunctionName;
                            return newButton;
                        }

                        // Create and show a floating palette
                        var my_palette = new Window("palette","Habillage");
                        
                        my_palette.add('statictext', undefined, 'Job type :');
                        my_palette.jobTypeList = my_palette.add('DropDownList', undefined, ['File', 'Folder']);
                        
                        my_palette.betaCb = my_palette.add('checkbox', undefined, 'Beta version');
                        
                        my_palette.browsBtn = addButton(my_palette, undefined, "Browse", thisObj.selectFolder);
                        my_palette.folderInput = my_palette.add('edittext', undefined, '<browse folder>', { characters: 30 }); // TODO ? input with current folder
                        
                       // my_palette.browsBtn = addButton(my_palette, undefined, "Add file to queue", thisObj.selectFolder);
                         
                        my_palette.startBtn = addButton(my_palette, undefined, "Start", thisObj.startProcess);

                        my_palette.jobTypeList.selection = 0;
                        my_palette.partIndexInput.text = 0;

                        my_palette.infoLabel = palette.add('statictext', undefined, "");

                        my_palette.show();
                                 /**
                                        * PALETTE Event Listeners
                                        *
                                        */
                                        my_palette.jobTypeList.onChange = function(){
                                            my_palette.folderInput.text = (this.selection==0)?"<browse file>":"<browse folder>";
                                        }

                                        my_palette.currentFileCb.onClick = function(){
                                            if(this.value == true){
                                                my_palette.jobTypeList.enabled = false;
                                                my_palette.folderInput.enabled = false;
                                                my_palette.browsBtn.enabled = false;
                                            }else{
                                                my_palette.jobTypeList.enabled = true;
                                                my_palette.folderInput.enabled = true;
                                                my_palette.browsBtn.enabled = true;
                                            }
                                        }
                                    
                        return my_palette;
                    }

                    function selectFolder(){
                        // Ask the user for a folder whose contents are to be imported.
                        inputFolder = new Folder('//CSV_BACKUP/main_raid5/CSV/');
                        inputFolder = inputFolder.selectDlg("Import items from folder...");        

                        // Get an array of files in the target folder.
                        files = inputFolder.getFiles();
                        numFiles = files.length;
                        palette.folderInput.text = inputFolder.toString();
                    }


                    function getWorkingFolder(){
                        return inputFolder.toString();
                    }
                    
                    function startProcess(){
                        if(palette.currentFileCb.value){
                            process = MainProcess();
                            process.setPartIndex(palette.partIndexInput.text);
                            process.startFile();
                            palette.startBtn.enabled = false;
                        }else{
                            var pathType = File(palette.folderInput.text);

                            if((palette.jobTypeList.selection == 0 && pathType instanceof File && pathType.exists) || (palette.jobTypeList.selection == 1 && pathType instanceof Folder && pathType.exists)){
                                process = MainProcess();
                                process.setPartIndex(palette.partIndexInput.text);
                                process.createJob(palette.jobTypeList.selection, palette.folderInput.text);
                                palette.startBtn.enabled = false;
                            }else{
                                alert('Sélectionne un dossier à traiter');
                            }
                        }
                    }
}
    

}