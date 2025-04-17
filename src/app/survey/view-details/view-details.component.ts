import {
  AfterViewInit,
  Component,
  ViewChild,
  ViewChildren,
  ElementRef,
  QueryList,
  HostListener,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { ApiService } from "../../providers/api.service";
import { PusherService } from "../../providers/pusher.service";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
//import { StatusBoxComponent } from "../status-box/status-box.component";
import { ViewDetailsModalComponent } from "../view-details-modal/view-details-modal.component";

@Component({
  selector: "app-view-details",
  templateUrl: "./view-details.component.html",
  styleUrls: ["./view-details.component.css"],
})
export class ViewDetailsComponent implements AfterViewInit {
  @ViewChild("scrollframe", { static: false }) scrollFrame: ElementRef;
  @ViewChildren("item") itemElements: QueryList<any>;

  private itemContainer: any;
  private scrollContainer: any;
  private items = [];
  private isNearBottom = true;

  ChatForm: FormGroup;
  statusUpdateForm: FormGroup;

  isSubmitted = false;
  currentSatatus = "";
  Endorsement_Id: any = 0;
  rightType: any = "";
  row: any = [];
  Messages: any = [];

  inputMessage: string = "";

  selectedFiles: File;
  Is_Attachement: string = "No";
  CurrentClaimStatus: any;

  showDocUploadDiv: any = "hide";
  showInspectionModeDiv: any = "hide";
  buttonDisable = false;
  EndorsementCopy: File;

  LoginUserId: any;
  Bank: any = [];
  State: any = [];
  Citys: any = [];
  AccountType: any = [];
  requestData: any;
  status: any;
  assignedToEmp: any;
  NameUpdateReason: any;
  NcbUpdateReason: any;
  RcFrontDoc: any;
  RcBackDoc: any;
  RequestLetterDoc: any;
  SupportingDoc: any;
  EndorsementCopyDoc: any;
  addedBy: any;
  mappedTo: any;
  curStatus: any;
  currentRemark: any;
  statusData: any = [];
  dropdownSettingsType1: {
    singleSelection: boolean;
    idField: string;
    textField: string;
    itemsShowLimit: number;
    enableCheckAll: boolean;
    allowSearchFilter: boolean;
  };
  Survery_Id: string;
  surveyDetails: any;
  rcFrontUrl: any;
  rcBackUrl: any;
  quotationDocUrl: any;
  formType: string;
  inspectionModeData: { Id: string; Name: string }[];
  InspectionReportUrl: any;
  inspectionMode: any;
  CompanyName: any;
  endosement_copy_define: any = 0;
  Details: any;

  constructor(
    public api: ApiService,
    private pusherService: PusherService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    public dialog: MatDialog
  ) {
    this.currentSatatus = "0";

    this.ChatForm = this.formBuilder.group({
      Message: [""],
    });

    this.LoginUserId = this.api.GetUserData("Id");
    this.Survery_Id = this.activatedRoute.snapshot.paramMap.get("Id");
    this.rightType = this.activatedRoute.snapshot.paramMap.get("RightType");
    if (this.rightType == "Manage") {
      this.formType = "Edit";
    }

    this.statusUpdateForm = this.formBuilder.group({
      status: ["", [Validators.required]],
      statusRemarks: [""],
      inspectionMode: [""],
      endorsementCopy: [""],
    });

    this.dropdownSettingsType1 = {
      singleSelection: true,
      idField: "Id",
      textField: "Name",
      itemsShowLimit: 1,
      enableCheckAll: false,
      allowSearchFilter: false,
    };

    this.GetRow();
  }

  ngAfterViewInit() {
    this.scrollContainer = this.scrollFrame.nativeElement;
    this.itemElements.changes.subscribe((_) => this.onItemElementsChanged());

    this.pusherService.channel.bind("new-message", (data) => {
      var res = JSON.parse(data.Message);

      // if ( (res.Sender_Id == this.LoginUserId ||  res.Receiver_Id == this.LoginUserId) && res.Type == "Inspection" ) {
      if (res.Type == "Inspection") {
        this.GetMessages();
      }
    });

    this.api.TargetComponent.subscribe(
      (page) => {
        // console.log(page);
        if (page == "Inspection") {
          this.GetRow();
        }
      },
      (err) => {}
    );
  }

  private onItemElementsChanged(): void {
    if (this.isNearBottom) {
      this.scrollToBottom();
    }
  }

  private isUserNearBottom(): boolean {
    const threshold = 150;
    const position =
      this.scrollContainer.scrollTop + this.scrollContainer.offsetHeight;
    const height = this.scrollContainer.scrollHeight;
    return position > height - threshold;
  }

  scrolled(event: any): void {
    this.isNearBottom = this.isUserNearBottom();
  }

  private scrollToBottom(): void {
    this.scrollContainer.scroll({
      top: this.scrollContainer.scrollHeight,
      left: 0,
      behavior: "smooth",
    });
  }

  //===== GET FORM CONTROLS CHAT =====//
  get FC() {
    return this.ChatForm.controls;
  }

  //===== GET FORM CONTROLS STATUS UPDATE =====//
  get formControls() {
    return this.statusUpdateForm.controls;
  }

  Send() {
    this.isSubmitted = true;
    if (this.ChatForm.invalid) {
      return;
    } else {
      var fields = this.ChatForm.value;

      if (this.Is_Attachement == "No") {
        if (fields["Message"] == "" || fields["Message"] == null) {
          return;
        }
      }

      const formData = new FormData();

      formData.append("Reference_Id", this.row.id);
      formData.append("Reference_No", this.Endorsement_Id);

      formData.append("CreateUser_Id", this.row.CreateUser_Id);
      formData.append("CreateUser_Type", this.row.CreateUser_Type);

      formData.append("CurrentUser_Id", this.row.CurrentUser_Id);
      formData.append("CurrentUser_Type", this.row.CurrentUser_Type);

      formData.append("Login_User_Id", this.api.GetUserData("Id"));
      formData.append("Login_User_Type", this.api.GetUserType());

      formData.append("Message", fields["Message"]);
      formData.append("Attachement", this.selectedFiles);
      formData.append("Is_Attachement", this.Is_Attachement);
      formData.append("Type", "Inspection");

      this.ChatForm.reset();
      if (this.Is_Attachement == "Yes") {
        this.api.IsLoading();
      }

      this.api.HttpPostType("Chat/Send", formData).then(
        (result) => {
          this.GetMessages();

          if (this.Is_Attachement == "Yes") {
            this.api.HideLoading();
          }

          if (result["status"] == true) {
            this.Is_Attachement = "No";
          } else {
            this.Is_Attachement = "No";
            this.api.Toast("Warning", result["msg"]);
          }
        },
        (err) => {
          this.api.HideLoading();
          this.api.Toast(
            "Warning",
            "Network Error : " + err.name + "(" + err.statusText + ")"
          );
        }
      );
    }
  }

  GetMessages() {
    //this.api.IsLoading();
    this.api
      .HttpGetType(
        "Chat/Messages?Reference_Id=" +
          this.row.id +
          "&User_Id=" +
          this.api.GetUserData("Id") +
          "&Type=Inspection"
      )
      .then(
        (result) => {
          if (result["status"] == true) {
            this.Messages = result["Messages"];
            this.scrollToBottom();
          } else {
          }
        },
        (err) => {
          this.api.HideLoading();
          this.api.Toast(
            "Warning",
            "Network Error : " + err.name + "(" + err.statusText + ")"
          );
        }
      );
  }

  //===== GET SINGLE SR DETAILS ======//
  GetRow() {
    const formData = new FormData();
    formData.append("id", this.Survery_Id);

    this.api.IsLoading();
    this.api.HttpPostType("b-crm/Survey/getSingleSurveyDetails", formData).then(
      (result) => {
        if (result["status"] == true) {
          this.row = result["data"];
          this.surveyDetails = result["data"];
          this.CompanyName = result["CompanyName"];
          this.rcFrontUrl = result["rcFront"];
          this.rcBackUrl = result["rcBack"];
          this.quotationDocUrl = result["quotationDoc"];
          this.InspectionReportUrl = result["inspectionReportDoc"];
          this.addedBy = result["addedBy"];
          this.mappedTo = result["mappedTo"];
          this.curStatus = result["curStatus"];
          this.currentRemark = result["currentRemark"];
          this.statusData = result["statusArray"];
          this.Details = result["Self_Details"];

          //   //   //   console.log(this.Details);

          this.inspectionModeData = [
            { Id: "1", Name: "Self" },
            { Id: "2", Name: "Agency" },
          ];

          this.statusUpdateForm.controls["inspectionMode"].setValidators(null);
          this.showInspectionModeDiv = "hide";

          this.statusUpdateForm.get("inspectionMode").updateValueAndValidity();
        } else {
          this.api.Toast("Warning", result["msg"]);
        }
      },
      (err) => {
        this.api.HideLoading();
        this.api.Toast(
          "Warning",
          "Network Error : " + err.name + "(" + err.statusText + ")"
        );
      }
    );
    this.api.HideLoading();
  }

  ViewDocument(url) {
    window.open(url, "", "left=100,top=50,width=800%,height=600");
  }

  UpdateClaimStatus(e) {
    this.CurrentClaimStatus = e.target.value;

    if (e.target.value == "0") {
    } else if (confirm("Are you sure !") == true) {
      this.api.IsLoading();
      this.api
        .HttpGetType(
          "Claim/UpdateStatus?Id=" +
            this.row.Id +
            "&Status=" +
            this.CurrentClaimStatus +
            "&User_Id=" +
            this.api.GetUserData("Id")
        )
        .then(
          (result) => {
            this.api.HideLoading();
            if (result["status"] == 1) {
              this.api.Toast("Success", result["msg"]);
              //this.row = result['data'];

              this.row.Status = this.CurrentClaimStatus;
              this.currentSatatus = "0";
              this.GetRow();
            } else {
              //alert(result['message']);
              this.api.Toast("Warning", result["msg"]);
            }
          },
          (err) => {
            // Error log
            //// console.log(err);
            this.api.HideLoading();
            this.api.Toast(
              "Warning",
              "Network Error : " + err.name + "(" + err.statusText + ")"
            );
          }
        );
    }
  }

  UploadAttachment(event) {
    this.selectedFiles = event.target.files[0];
    if (event.target.files && event.target.files[0]) {
      // console.log(this.selectedFiles);
      // console.log(this.selectedFiles.name);
      var str = this.selectedFiles.name;
      var ar = str.split(".");
      // console.log(ar);
      var ext;
      for (var i = 0; i < ar.length; i++) ext = ar[i].toLowerCase();
      // console.log(ext);

      if (ext == "png" || ext == "jpeg" || ext == "jpg" || ext == "pdf") {
        // console.log("Extenstion is vaild !");
        var file_size = event.target.files[0]["size"];
        const Total_Size = Math.round(file_size / 1024);

        // console.log(Total_Size + " kb");

        if (Total_Size >= 1024 * 3) {
          // allow only 2 mb
          this.api.Toast("Warning", "File size is greater than 3 mb");
        } else {
          this.selectedFiles;
          this.Is_Attachement = "Yes";
          this.Send();
        }
      } else {
        // console.log("Extenstion is not vaild !");
        this.api.Toast(
          "Warning",
          "Please choose vaild file ! ie :- PNG,JPEG,JPG,PDF"
        );
      }
    }
  }

  //===== UPDATE REQUEST STATUS =====//
  updateRequestStatus() {
    this.isSubmitted = true;
    if (this.statusUpdateForm.invalid) {
      return;
    } else {
      this.buttonDisable = true;

      var fields = this.statusUpdateForm.value;

      if (fields["status"][0]["Name"] == "In Process") {
        this.inspectionMode = fields["inspectionMode"][0]["Name"];
      } else {
        this.inspectionMode = this.row.inspectionMode;
      }

      const formData = new FormData();
      formData.append("id", this.row["id"]);
      formData.append("loginId", this.api.GetUserData("Id"));
      formData.append("loginType", this.api.GetUserType());
      formData.append("status", fields["status"][0]["Id"]);
      formData.append("inspectionMode", this.inspectionMode);
      formData.append("statusRemarks", fields["statusRemarks"]);
      formData.append("endorsementCopy", this.EndorsementCopy);

      this.api.IsLoading();
      this.api.HttpPostType("b-crm/Survey/updateRequestStatus", formData).then(
        (result) => {
          this.api.HideLoading();

          if (result["status"] == 1) {
            this.buttonDisable = false;
            // this.statusUpdateForm.reset();
            this.GetRow();

            this.api.Toast("Success", result["msg"]);
          } else {
            this.buttonDisable = false;

            const msg = "msg";
            this.api.Toast("Warning", result["msg"]);
          }
        },
        (err) => {
          this.buttonDisable = false;

          this.api.HideLoading();
          const newLocal = "Warning";
          this.api.Toast(
            newLocal,
            "Network Error : " + err.name + "(" + err.statusText + ")"
          );
        }
      );
    }
  }

  //===== SHOW HIDE ENDORSEMENT COPY UPLOAD DIV =====//
  showHideDocUploadDiv(eve: any) {
    var statusSel = eve["Name"];
    if (
      statusSel == "Recommended" ||
      statusSel == "Not-Recommended" ||
      statusSel == "Refer To Insurer"
    ) {
      this.showDocUploadDiv = "show";
      this.statusUpdateForm.controls["endorsementCopy"].setValidators([
        Validators.required,
      ]);
    } else {
      this.statusUpdateForm.controls["endorsementCopy"].setValidators(null);
      this.showDocUploadDiv = "hide";
    }

    if (statusSel == "In Process") {
      this.statusUpdateForm.controls["inspectionMode"].setValidators([
        Validators.required,
      ]);
      this.showInspectionModeDiv = "show";
    } else {
      this.statusUpdateForm.controls["inspectionMode"].setValidators(null);
      this.showInspectionModeDiv = "hide";
    }

    this.statusUpdateForm.get("endorsementCopy").updateValueAndValidity();
    this.statusUpdateForm.get("inspectionMode").updateValueAndValidity();
  }

  checkFileType(event: any, Type: any) {
    this.selectedFiles = event.target.files[0];
    if (event.target.files && event.target.files[0]) {
      var str = this.selectedFiles.name;
      var ar = str.split(".");
      var ext;
      for (var i = 0; i < ar.length; i++) ext = ar[i].toLowerCase();

      if (ext == "png" || ext == "jpeg" || ext == "jpg" || ext == "pdf") {
        var file_size = event.target.files[0]["size"];
        const Total_Size = Math.round(file_size / 1024);

        if (Total_Size >= 1024 * 3) {
          // allow only 1 mb
          this.api.Toast("Error", "File size is greater than 3 mb");

          if (Type == "Endorsement_Copy") {
            this.statusUpdateForm.get("endorsementCopy").setValue("");
            this.endosement_copy_define = 0;
          }
        } else {
          if (Type == "Endorsement_Copy") {
            this.endosement_copy_define = 1;

            this.EndorsementCopy = this.selectedFiles;
          }
        }
      } else {
        this.api.Toast(
          "Error",
          "Please choose vaild file ! Example :- PNG,JPEG,JPG,PDF"
        );
      }
    }
  }

  openDialog(id: any) {
    const dialogConfig = this.dialog.open(ViewDetailsModalComponent, {
      width: "90%",
      height: "90%",
      data: { sid: id },
    });

    dialogConfig.afterClosed().subscribe((result: any) => {
      // console.log(result);
    });
  }
}
