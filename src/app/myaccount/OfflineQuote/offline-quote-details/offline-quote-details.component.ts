import { ConfrimPaymentMethodComponent } from "./../../../modals/confrim-payment-method/confrim-payment-method.component";
// import { Component,   } from '@angular/core';
import {
  AfterViewInit,
  Component,
  ViewChild,
  ViewChildren,
  ElementRef,
  QueryList,
  HostListener,
  OnInit,
} from "@angular/core";
import {
  FormBuilder,
  FormArray,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from "../../../../environments/environment";
import { ApiService } from "../../../providers/api.service";
import { SocketioService } from "../../../providers/socketio.service";
import { RejectquoteComponent } from "../../OfflineQuote/rejectquote/rejectquote.component";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { PusherService } from "../../../providers/pusher.service";
import { ViewDetailsModalComponent } from "../../../survey/view-details-modal/view-details-modal.component";

@Component({
  selector: "app-offline-quote-details",
  templateUrl: "./offline-quote-details.component.html",
  styleUrls: ["./offline-quote-details.component.css"],
})
export class OfflineQuoteDetailsComponent implements AfterViewInit {
  @ViewChild("scrollframe", { static: false }) scrollFrame: ElementRef;
  @ViewChildren("item") itemElements: QueryList<any>;

  private itemContainer: any;
  private scrollContainer: any;
  private items = [];
  private isNearBottom = true;

  ChatForm: FormGroup;
  Messages: any = [];
  LoginUserId: any;
  AddFlagForm: FormGroup;

  Quotation_Id: any = 0;
  RedicrctBackYypes: any = 0;
  row: any = [];
  Status: any = [];
  QuoteAction: any = [];
  Company: any = [];
  RequestedQuote: any = [];
  dropdownSettingsType: any = "";
  RequestedQuoteDate: any = [];
  SharedQuoteForm: FormGroup;
  AddCompletePaymentForm: FormGroup;
  PaymentUrlQuoteForm: FormGroup;
  ShareToPunchingTeam: FormGroup;
  AddPaymentConfrim: FormGroup;

  inputMessage: string = "";
  isSubmitted = false;

  images = [];
  selectedFiles: any;
  images1: File;
  CountInsurerName = [];
  GetSharedPaymentUrl: any;

  Is_Attachement: string = "No";

  Image_1: any;
  Image_2: any;
  Image_3: any;
  Image_4: any;
  Image_5: any;

  PolicyPdf: File;
  PaymentProof: File;

  PaymentUrls: File;
  CompletePaymentForm: FormGroup;
  RejectedStatus: any;
  GetSingleData: any;
  GetPunchingTeamEmployee: any;
  ChequeImage: any;
  acceptQuoteValueId: any;
  acceptQuoteValue: any;

  Pan_image: number;
  Pan: File;

  Other: File;
  Aadhaar_Back: File;
  Aadhaar_Front: File;
  aadhar_image_front: number;
  aadhar_image_back: number;
  Other_image: number;

  constructor(
    public api: ApiService,
    public socketService: SocketioService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fB: FormBuilder,
    public dialog: MatDialog,
    private pusherService: PusherService
  ) {
    this.LoginUserId = this.api.GetUserData("Id");

    this.dropdownSettingsType = {
      singleSelection: true,
      idField: "Id",
      textField: "Name",
      itemsShowLimit: 1,
      enableCheckAll: false,
      allowSearchFilter: true,
    };

    this.SharedQuoteForm = this.fB.group({
      survey: ["", Validators.required],
      surveyRemark: [""],
      quantities: this.fB.array([]),
    });

    this.AddFlagForm = this.fB.group({
      PunchingTeamEmployee: [""],
      pan_document: [""],
      aadhaar_document_back: [""],
      aadhaar_document_front: [""],
      OtherDocument: [""],
      prioritytype: [""],
    });

    this.PaymentUrlQuoteForm = this.fB.group({
      PaymentMethod: ["payment_link_by_insurer", Validators.required],
      pay_mobile: [""],
      pay_email: [""],
      PaymentUrl: ["",Validators.pattern],
      chequeImage: [""],
      Cheque_No: [""],
    });


    this.AddPaymentConfrim = this.fB.group({
      PolicyNumber: ["", Validators.required],
      PolicyPdf: ["", Validators.required],
      PaymentProof: [""],
    });

    this.CompletePaymentForm = this.fB.group({
      CompletedSr_No: ["", Validators.required],
    });

    this.ShareToPunchingTeam = this.fB.group({
      PunchingTeam: ["", Validators.required],
    });

    this.SharedQuoteForm.get("survey").setValue("0");

    this.Quotation_Id = this.activatedRoute.snapshot.paramMap.get("Quotation");
    this.RedicrctBackYypes = this.activatedRoute.snapshot.url[0].path;
    this.GetRequestedQuote();
    this.GetAcceptQuoteDetails();
    //   //   //   console.log(this.RedicrctBackYypes);
    this.GetRow();

    this.FilterDatacompany();
    this.addQuantity();
    this.addQuantity();
    this.addQuantity();
    this.addQuantity();
    this.addQuantity();

    this.api.TargetComponent.subscribe(
      (page) => {
        //   //   //   console.log(page);
        if (page == "offline_quotation" || page == "offline_quotation") {
          this.GetRow();
          // this.GetMessages();
        }
      },
      (err) => {}
    );

    this.ChatForm = this.fB.group({
      Message: [""],
    });
  }
  get formControls() {
    return this.SharedQuoteForm.controls;
  }
  get formControls1() {
    return this.PaymentUrlQuoteForm.controls;
  }
  get formControls2() {
    return this.AddPaymentConfrim.controls;
  }
  get formControls3() {
    return this.CompletePaymentForm.controls;
  }
  get formControls4() {
    return this.ShareToPunchingTeam.controls;
  }
  get formControlsAddPaymentConfrim() {
    return this.AddPaymentConfrim.controls;
  }

  quantities(): FormArray {
    return this.SharedQuoteForm.get("quantities") as FormArray;
  }

  newQuantity(): FormGroup {
    return this.fB.group({
      Insurer: [""],
      Files: [""],
      Remarks: [""],
      GrossPremium: [""],
    });
  }

  addQuantity() {
    this.quantities().push(this.newQuantity());
  }

  removeQuantity(i: number) {
    this.quantities().removeAt(i);
  }

  ngAfterViewInit() {
    this.scrollContainer = this.scrollFrame.nativeElement;
    this.itemElements.changes.subscribe((_) => this.onItemElementsChanged());

    this.socketService.setupSocketConnection();

    this.socketService.ReceiveMessage().subscribe((res: any) => {
      //alert(res.Receiver_Id);
      if (res.Receiver_Id === this.api.GetUserData("Id")) {
        this.GetMessages();
      }
    });

    /*
    this.pusherService.channel.bind("new-message", (data) => {
      // console.log(data.Message);

      var res = JSON.parse(data.Message);

   //   //   //   console.log(res);
   //   //   //   console.log(12345);

      ////   //   console.log(res.Sender_Id);
      ////   //   console.log(res.Receiver_Id);
      ////   //   console.log(res.Type);

      if (
        (res.Sender_Id == this.LoginUserId ||
          res.Receiver_Id == this.LoginUserId) &&
        res.Type == "OfflineQuote"
      ) {
        this.GetMessages();
      }
    });
    */
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

  get FC() {
    return this.ChatForm.controls;
  }

  get Formcontrols() {
    return this.SharedQuoteForm.controls;
  }

  UploadAttachment(event) {
    this.selectedFiles = event.target.files[0];
    if (event.target.files && event.target.files[0]) {
      //   //   //   console.log(this.selectedFiles);
      //   //   //   console.log(this.selectedFiles.name);
      var str = this.selectedFiles.name;
      var ar = str.split(".");
      //   //   //   console.log(ar);
      var ext;
      for (var i = 0; i < ar.length; i++) ext = ar[i].toLowerCase();
      //   //   //   console.log(ext);

      if (ext == "png" || ext == "jpeg" || ext == "jpg" || ext == "pdf") {
        //   //   //   console.log("Extenstion is vaild !");
        var file_size = event.target.files[0]["size"];
        const Total_Size = Math.round(file_size / 1024);

        //   //   //   console.log(Total_Size + " kb");

        if (Total_Size >= 1024 * 4) {
          // allow only 2 mb
          this.api.Toast("Warning", "File size is greater than 4 mb");
        } else {
          this.selectedFiles;
          this.Is_Attachement = "Yes";
          this.Send();
        }
      } else {
        //   //   //   console.log("Extenstion is not vaild !");
        this.api.Toast(
          "Warning",
          "Please choose vaild file ! ie :- PNG,JPEG,JPG,PDF"
        );
      }
    }
  }

  Send() {
    ////   //   console.log(this.ChatForm.value);
    ////   //   console.log(this.inputMessage);

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
      formData.append("Reference_Id", this.row.Id);
      formData.append("Reference_No", this.row.Quotation);

      formData.append("CreateUser_Id", this.row.CreateUser_Id);
      formData.append("CreateUser_Type", this.row.CreateUser_Type);

      formData.append("CurrentUser_Id", this.row.CurrentUser_Id);
      formData.append("CurrentUser_Type", this.row.CurrentUser_Type);

      formData.append("Login_User_Id", this.api.GetUserData("Id"));
      formData.append("Login_User_Type", this.api.GetUserType());

      formData.append("Message", fields["Message"]);
      formData.append("Attachement", this.selectedFiles);
      formData.append("Is_Attachement", this.Is_Attachement);
      formData.append("Type", "OfflineQuote");

      this.ChatForm.reset();
      if (this.Is_Attachement == "Yes") {
        this.api.IsLoading();
      }

      this.api.HttpPostType("Chat/Send", formData).then(
        (result) => {
          if (this.Is_Attachement == "Yes") {
            this.api.HideLoading();
          }

          if (result["status"] == true) {
            this.GetMessages();
            if (this.row.CreateUser_Id == this.LoginUserId) {
              this.socketService.sendMessage({
                Sender_Id: 0,
                Receiver_Id: this.row.CurrentUser_Id,
                Claim_Id: this.row.Id,
                Message: fields["Message"],
              });
            } else {
              this.socketService.sendMessage({
                Sender_Id: 0,
                Receiver_Id: this.row.CreateUser_Id,
                Claim_Id: this.row.Id,
                Message: fields["Message"],
              });
            }

            this.Is_Attachement = "No";

            //this.api.Toast('Success',result['msg']);
          } else {
            //alert(result['message']);
            this.Is_Attachement = "No";
            this.api.Toast("Warning", result["msg"]);
          }
        },
        (err) => {
          // Error log
          ////   //   console.log(err);
          this.api.HideLoading();
          this.api.Toast(
            "Warning",
            "Network Error : " + err.name + "(" + err.statusText + ")"
          );
          //this.api.ErrorMsg('Network Error :- ' + err.message);
        }
      );
    }
  }

  FilterDatacompany() {
    this.api.IsLoading();
    this.api
      .HttpGetType(
        "Globel/GetIns_Companies?User_Id=" +
          this.api.GetUserData("Id") +
          "&User_Type=" +
          this.api.GetUserType()
      )
      .then(
        (result) => {
          this.api.HideLoading();
          if (result["Status"] == true) {
            this.Company = result["Ins_Compaines"];
          } else {
            this.api.Toast("Warning", result["Message"]);
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

  SetImagesValues(Types, Numbers, setValue) {
    if (Types == "set") {
      if (Numbers == "Image_1") this.Image_1 = setValue;
      else if (Numbers == "Image_2") this.Image_2 = setValue;
      else if (Numbers == "Image_3") this.Image_3 = setValue;
      else if (Numbers == "Image_4") this.Image_4 = setValue;
      else if (Numbers == "Image_5") this.Image_5 = setValue;
    } else if (Types == "unset") {
      if (Numbers == "Image_1") this.Image_1 = "";
      else if (Numbers == "Image_2") this.Image_2 = "";
      else if (Numbers == "Image_3") this.Image_3 = "";
      else if (Numbers == "Image_4") this.Image_4 = "";
      else if (Numbers == "Image_5") this.Image_5 = "";
    }
  }

  UploadDocs(event, Image_no) {
    this.selectedFiles = event.target.files[0];
    if (event.target.files && event.target.files[0]) {
      //   //   //   console.log(this.selectedFiles);

      var str = this.selectedFiles.name;
      var ar = str.split(".");

      var ext;
      for (var i = 0; i < ar.length; i++) ext = ar[i].toLowerCase();

      if (ext == "png" || ext == "jpeg" || ext == "jpg" || ext == "pdf") {
        var file_size = event.target.files[0]["size"];
        const Total_Size = Math.round(file_size / 1024);

        if (Total_Size >= 1024 * 2) {
          this.api.Toast("Warning", "File size is greater than 2 mb");
          this.SetImagesValues("unset", Image_no, this.selectedFiles);
        } else {
          this.SetImagesValues("set", Image_no, this.selectedFiles);
        }
      } else {
        this.api.Toast(
          "Warning",
          "Please choose vaild file ! Example :- PNG,JPEG,JPG,PDF"
        );
        this.SetImagesValues("unset", Image_no, this.selectedFiles);
      }
    }
  }

  UploadDocsKyc(event, Type) {
    this.selectedFiles = event.target.files[0];
    if (event.target.files && event.target.files[0]) {
      //   //   //   console.log(this.selectedFiles);
      //   //   //   console.log(this.selectedFiles.name);
      var str = this.selectedFiles.name;
      var ar = str.split(".");
      //   //   //   console.log(ar);
      var ext;
      for (var i = 0; i < ar.length; i++) ext = ar[i].toLowerCase();
      //   //   //   console.log(ext);

      if (ext == "png" || ext == "jpeg" || ext == "jpg" || ext == "pdf") {
        //   //   //   console.log("Extenstion is vaild !");
        var file_size = event.target.files[0]["size"];
        const Total_Size = Math.round(file_size / 1024);
        // alert(Total_Size);
        //   //   //   console.log(Total_Size + " kb");

        if (Total_Size >= 10240) {
          // allow only 2 mb

          this.api.Toast("Error", "File size is greater than 10 mb");

          if (Type == "Pan_image") {
            this.AddFlagForm.get("Pan_image").setValue("");
            this.Pan_image = 0;
          }

          if (Type == "aadhar_image_back") {
            this.AddFlagForm.get("aadhaar_document_back").setValue("");
            this.aadhar_image_back = 0;
          }

          if (Type == "aadhar_image_front") {
            this.AddFlagForm.get("aadhaar_document_front").setValue("");
            this.aadhar_image_front = 0;
          }

          if (Type == "Other") {
            this.AddFlagForm.get("OtherDocument").setValue("");
            this.Other_image = 0;
          }
        } else {
          if (Type == "Pan_image") {
            this.Pan = this.selectedFiles;
            this.Pan_image = 1;
          }
          if (Type == "aadhar_image_back") {
            this.Aadhaar_Back = this.selectedFiles;
            this.aadhar_image_back = 1;
          }

          if (Type == "aadhar_image_front") {
            this.Aadhaar_Front = this.selectedFiles;
            this.aadhar_image_front = 1;
          }
          if (Type == "Other") {
            this.Other = this.selectedFiles;
            this.Other_image = 1;
          }
        }
      } else {
        //   //   //   console.log("Extenstion is not vaild !");

        this.api.Toast(
          "Error",
          "Please choose vaild file ! Example :- PNG,JPEG,JPG,PDF"
        );
      }
    }
  }

  AddSharedCompany() {
    var fields = this.SharedQuoteForm.value;
    const formData = new FormData();
    this.isSubmitted = true;
    if (this.SharedQuoteForm.invalid) {
      //   //   //   console.log(fields);
      //   //   //   console.log(this.SharedQuoteForm.invalid);

      return;
    } else {
      formData.append("User_Id", "123");
      formData.append("fields", JSON.stringify(fields));
      formData.append("Image_1", this.Image_1);
      formData.append("Image_2", this.Image_2);
      formData.append("Image_3", this.Image_3);
      formData.append("Image_4", this.Image_4);
      formData.append("Image_5", this.Image_5);

      formData.append("survey", fields["survey"]);
      formData.append("surveyRemark", fields["surveyRemark"]);

      if (confirm("Are you sure !") == true) {
        this.api.IsLoading(); //TypeArray
        this.api
          .HttpPostType(
            "Offlinequote/SharedQuotes?User_Id=" +
              this.api.GetUserData("Id") +
              "&User_Type=" +
              this.api.GetUserType() +
              "&quotation_id=" +
              this.Quotation_Id,
            formData
          )
          .then(
            (result) => {
              this.api.HideLoading();

              if (result["status"] == 1) {
                this.api.Toast("Success", result["msg"]);
                this.GetRow();
                this.GetRequestedQuote();
                this.SharedQuoteForm.reset();
                this.SharedQuoteForm.get("survey").setValidators(null);
                this.SharedQuoteForm.get("survey").updateValueAndValidity();
              } else {
                const msg = "msg";
                this.api.Toast("Warning", result["msg"]);
              }
            },
            (err) => {
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
  }

  AddPaymentUrlForm(type: any, row_Id: any) {


    console.log(this.PaymentUrlQuoteForm.value['PaymentMethod']);


    const paymentmethod= this.PaymentUrlQuoteForm.value['PaymentMethod'];

    if(paymentmethod == 'payment_link_by_insurer'){
      this.PaymentUrlQuoteForm.get("pay_mobile").setValidators([Validators.required]);
      this.PaymentUrlQuoteForm.get("pay_email").setValidators([Validators.required]);
    }else{
      this.PaymentUrlQuoteForm.get("pay_mobile").setValidators(null);
      this.PaymentUrlQuoteForm.get("pay_email").setValidators(null);
    }

    this.PaymentUrlQuoteForm.get("pay_mobile").updateValueAndValidity();
    this.PaymentUrlQuoteForm.get("pay_email").updateValueAndValidity();





    var fields = this.PaymentUrlQuoteForm.value;
    const formData = new FormData();
    this.isSubmitted = true;
    if (this.PaymentUrlQuoteForm.invalid) {
      return;
    } else {
      formData.append("PaymentUrl", fields["PaymentUrl"]);
      formData.append("PaymentMethod", fields["PaymentMethod"]);
      formData.append("ChequeImage", this.ChequeImage);
      formData.append("ChequeNo", fields["Cheque_No"]);
      formData.append("pay_mobile", fields["pay_mobile"]);
      formData.append("pay_email", fields["pay_email"]);

      // if (fields["PaymentMethod"] == "Cash" && row_Id != "") {
      //   this.SrPopup(type, row_Id);
      //   if (confirm("Are you sure SrPopup!") == true) {
      //     this.api.IsLoading(); //TypeArray
      //     this.api
      //       .HttpPostType(
      //         "Offlinequote/AddPaymentUrl?User_Id=" +
      //           this.api.GetUserData("Id") +
      //           "&User_Type=" +
      //           this.api.GetUserType() +
      //           "&Quotation=" +
      //           this.Quotation_Id,
      //         formData
      //       )
      //       .then(
      //         (result) => {
      //           this.api.HideLoading();
      //           if (result["status"] == true) {
      //             this.GetRow();
      //           } else {
      //             const msg = "msg";
      //             this.api.Toast("Warning", result["msg"]);
      //           }
      //         },
      //         (err) => {
      //           this.api.HideLoading();
      //           const newLocal = "Warning";
      //           this.api.Toast(
      //             newLocal,
      //             "Network Error : " + err.name + "(" + err.statusText + ")"
      //           );
      //         }
      //       );
      //   }
      // } else if (fields["PaymentMethod"] == "Cash" && row_Id == "") {
      //   this.CreateAnSr("Cash");
      //   if (confirm("Are you sure CreateAnSr!") == true) {
      //     this.api.IsLoading(); //TypeArray
      //     this.api
      //       .HttpPostType(
      //         "Offlinequote/AddPaymentUrl?User_Id=" +
      //           this.api.GetUserData("Id") +
      //           "&User_Type=" +
      //           this.api.GetUserType() +
      //           "&Quotation=" +
      //           this.Quotation_Id,
      //         formData
      //       )
      //       .then(
      //         (result) => {
      //           this.api.HideLoading();
      //           if (result["status"] == true) {
      //             this.GetRow();
      //           } else {
      //             const msg = "msg";
      //             this.api.Toast("Warning", result["msg"]);
      //           }
      //         },
      //         (err) => {
      //           this.api.HideLoading();
      //           const newLocal = "Warning";
      //           this.api.Toast(
      //             newLocal,
      //             "Network Error : " + err.name + "(" + err.statusText + ")"
      //           );
      //         }
      //       );
      //   }
      // } else {

      
        if (confirm("Are you sure accept !") == true) {
          this.api.IsLoading(); //TypeArray
          this.api
            .HttpPostType(
              "OfflinequoteNew/AddPaymentUrl?User_Id=" +
                this.api.GetUserData("Id") +
                "&User_Type=" +
                this.api.GetUserType() +
                "&Quotation=" +
                this.Quotation_Id,
              formData
            )
            .then(
              (result: any) => {
                this.api.HideLoading();
                if (result["status"] == true) {
                  this.GetRow();
                } else {
                  const msg = "msg";
                  this.api.Toast("Warning", result["msg"]);
                }
              },
              (err) => {
                this.api.HideLoading();
                const newLocal = "Warning";
                this.api.Toast(
                  newLocal,
                  "Network Error : " + err.name + "(" + err.statusText + ")"
                );
              }
            );
        }
      // }
    }
  }

  UploadDocss(event, Type) {
    this.selectedFiles = event.target.files[0];
    if (event.target.files && event.target.files[0]) {
      //   //   //   console.log(this.selectedFiles);
      //   //   //   console.log(this.selectedFiles.name);
      var str = this.selectedFiles.name;
      var ar = str.split(".");
      //   //   //   console.log(ar);
      var ext;
      for (var i = 0; i < ar.length; i++) ext = ar[i].toLowerCase();
      //   //   //   console.log(ext);

      if (ext == "png" || ext == "jpeg" || ext == "jpg" || ext == "pdf") {
        //   //   //   console.log("Extenstion is vaild !");
        var file_size = event.target.files[0]["size"];
        const Total_Size = Math.round(file_size / 1024);

        //   //   //   console.log(Total_Size + " kb");

        if (Total_Size >= 6048) {
          // allow only 1 mb
          this.api.Toast("Error", "File size is greater than 5 mb");

          //document.querySelector('.RC_Motor_Registraion').value = '';
          // if(Type == 'PaymentUrl'){ this.RC_Registration_Reset.nativeElement.value = ''; }

          /*
            if(Type == 'RC_Motor_Registraion'){ this.RC_Registration_Reset.nativeElement.value = ''; }
            if(Type == 'Previous_Policy_Copy'){ this.Previous_Policy_Copy_Reset.nativeElement.value = ''; }
            if(Type == 'Cheque_Payment_Recipt'){ this.Cheque_Payment_Recipt_Reset.nativeElement.value = ''; }
            if(Type == 'Mandate_Letter'){ this.Mandate_Letter_Reset.nativeElement.value = ''; }
            if(Type == 'Invoice'){ this.Invoice_Reset.nativeElement.value = ''; }
            if(Type == 'Renewal_Notice'){ this.Renewal_Notice_Reset.nativeElement.value = ''; }
            if(Type == 'Other'){ this.Other_Reset.nativeElement.value = ''; }

             */
        } else {
          if (Type == "PolicyPdf") {
            this.PolicyPdf = this.selectedFiles;
          }
          if (Type == "PaymentProof") {
            this.PaymentProof = this.selectedFiles;
          }
          if (Type == "PaymentUrl") {
            this.PaymentUrls = this.selectedFiles;
          }
          if (Type == "chequeImage") {
            this.ChequeImage = this.selectedFiles;
          }
        }
      } else {
        //   //   //   console.log("Extenstion is not vaild !");

        this.api.Toast(
          "Error",
          "Please choose vaild file ! Example :- PNG,JPEG,JPG,PDF"
        );
      }
    }
  }

  AddPaymentConfrimForm() {
    var fields = this.AddPaymentConfrim.value;
    const formData = new FormData();
    this.isSubmitted = true;
    if (this.AddPaymentConfrim.invalid) {
      return;
    } else {
      formData.append("PolicyNumber", fields["PolicyNumber"]);
      formData.append("PolicyPdf", this.PolicyPdf);
      formData.append("PaymentProof", this.PaymentProof);

      if (confirm("Are you sure !") == true) {
        this.api.IsLoading(); //TypeArray
        this.api
          .HttpPostType(
            "Offlinequote/AddPaymentConfrimForm?User_Id=" +
              this.api.GetUserData("Id") +
              "&User_Type=" +
              this.api.GetUserType() +
              "&Quotation=" +
              this.Quotation_Id,
            formData
          )
          .then(
            (result) => {
              this.api.HideLoading();
              if (result["status"] == true) {
                this.GetRow();

                this.CreateAnSr("No");
              } else {
                const msg = "msg";
                this.api.Toast("Warning", result["msg"]);
              }
            },
            (err) => {
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
  }

  removeItems(arrs: any, indexs: any) {
    var arr = arrs;
    var index = arr.indexOf(indexs);
    if (index >= 0) {
      arr.splice(index, 1);
    }
    return arr;
  }

  onItemSelectShareRowWise(event: any) {
    this.CountInsurerName.push(event.Id);
    //   //   //   console.log(this.CountInsurerName);
  }

  onItemDeSelectShareRowWise(event: any) {
    this.removeItems(this.CountInsurerName, event.Id);
    //   //   //   console.log(this.CountInsurerName);
  }

  GetRow() {
    this.api.IsLoading();
    this.api
      .HttpGetType(
        "offlinequote/SingleData?User_Id=" +
          this.api.GetUserData("Id") +
          "&User_Type=" +
          this.api.GetUserType() +
          "&Quotation=" +
          this.Quotation_Id +
          "&types=" +
          this.RedicrctBackYypes
      )
      .then(
        (result) => {
          this.api.HideLoading();
          if (result["status"] == 1) {
            //this.api.Toast('Success',result['msg']);
            this.row = result["data"];
            this.GetSingleData = result["data"];
            this.Status = result["Status"];
            this.RejectedStatus = result["RejectedStatus"];
            this.QuoteAction = result["AssignBy"];
            // this.CurrentClaimStatus = this.row.Status;
            this.GetAcceptQuoteDetails();
            //   //   //   console.log(this.row);

            if (this.Status == 2 || this.Status == 3) {
              this.GetPunchingTeam();
            }

            this.GetMessages();
          } else {
            //alert(result['message']);
            this.api.Toast("Warning", result["msg"]);
          }
        },
        (err) => {
          // Error log
          ////   //   console.log(err);
          this.api.HideLoading();
          this.api.Toast(
            "Warning",
            "Network Error : " + err.name + "(" + err.statusText + ")"
          );
          //this.api.ErrorMsg('Network Error :- ' + err.message);
        }
      );
  }

  GetRequestedQuote() {
    this.api.IsLoading();
    this.api
      .HttpGetType(
        "offlinequote/GetRequestedQuote?User_Id=" +
          this.api.GetUserData("Id") +
          "&User_Type=" +
          this.api.GetUserType() +
          "&Quotation=" +
          this.Quotation_Id +
          "&types=" +
          this.RedicrctBackYypes
      )
      .then(
        (result) => {
          this.api.HideLoading();
          if (result["status"] == 1) {
            this.RequestedQuote = result["data"];
            this.RequestedQuoteDate = result["Date"];
            //   //   //   console.log(this.row);
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
  }

  AcceptQuotes(Id: any) {
    const formData = new FormData();

    if (this.acceptQuoteValue == 0) {
      var fields = this.AddFlagForm.value;
      formData.append(
        "PunchingEmployee",
        JSON.stringify(fields["PunchingTeamEmployee"])
      );
      formData.append("prioritytype", fields["prioritytype"]);
    }

    formData.append("id", this.acceptQuoteValueId);
    formData.append("PanDocument", this.Pan);
    formData.append("Aadhaar_Back", this.Aadhaar_Back);
    formData.append("Aadhaar_Front", this.Aadhaar_Front);
    formData.append("OtherDocument", this.Other);

    if (confirm("Are you sure !") == true) {
      this.api.IsLoading();
      this.api
        .HttpPostType(
          "Offlinequote/AcceptQuotes?User_Id=" +
            this.api.GetUserData("Id") +
            "&User_Type=" +
            this.api.GetUserType() +
            "&Quotation=" +
            this.Quotation_Id,
          formData
        )
        .then(
          (result) => {
            this.api.HideLoading();
            if (result["status"] == true) {
              this.RequestedQuote = result["data"];
              this.GetRow();
              // If="row.SurveyStatus == '1' && row.SurveyId =='0'
              $("#ClosePOUPUP").click();

              if (this.row.SurveyStatus == 1 && this.row.SurveyId == "0") {
                this.router.navigate([
                  "/survey/create-requests/" + this.row.Quotation,
                ]);
              }

              this.GetAcceptQuoteDetails();
              this.GetRequestedQuote();
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
    }
  }

  acceptQuoteValueManger(Id: any, Val: any) {
    this.acceptQuoteValueId = Id;
    this.acceptQuoteValue = Val;
  }

  GetAcceptQuoteDetails() {
    this.api.IsLoading();
    this.api
      .HttpGetType(
        "Offlinequote/GetSharedPaymentUrl?User_Id=" +
          this.api.GetUserData("Id") +
          "&User_Type=" +
          this.api.GetUserType() +
          "&Quotation=" +
          this.Quotation_Id
      )
      .then(
        (result) => {
          this.api.HideLoading();
          if (result["status"] == true) {
            this.GetSharedPaymentUrl = result["Data"];

            //   //   //   console.log(this.GetSharedPaymentUrl);
          } else {
            //alert(result['message']);
            this.api.Toast("Warning", result["msg"]);
          }
        },
        (err) => {
          // Error log
          ////   //   console.log(err);
          this.api.HideLoading();
          this.api.Toast(
            "Warning",
            "Network Error : " + err.name + "(" + err.statusText + ")"
          );
          //this.api.ErrorMsg('Network Error :- ' + err.message);
        }
      );
  }

  ViewDocument(url) {
    //alert(url);
    window.open(url, "", "left=100,top=50,width=800%,height=600");
  }

  AcceptAssignQuote() {
    if (confirm("Are you sure !") == true) {
      this.api.IsLoading();
      this.api
        .HttpGetType(
          "Offlinequote/AcceptAssignQuote?User_Id=" +
            this.api.GetUserData("Id") +
            "&User_Type=" +
            this.api.GetUserType() +
            "&Quotation=" +
            this.Quotation_Id
        )
        .then(
          (result) => {
            this.api.HideLoading();
            if (result["status"] == true) {
              this.RequestedQuote = result["data"];
              this.GetRow();
              this.GetAcceptQuoteDetails();
              this.GetRequestedQuote();

              //   //   //   console.log(this.row);
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
    }
  }

  FetchPunchingEmployee() {}

  CompletedPayment() {
    this.isSubmitted = true;
    var fields = this.CompletePaymentForm.value;
    const formData = new FormData();

    if (this.CompletePaymentForm.invalid) {
      return;
    } else {
      if (confirm("Are you sure !") == true) {
        formData.append("Quotation", this.Quotation_Id);
        formData.append("Sr_No", fields["CompletedSr_No"]);

        this.api.IsLoading(); //TypeArray
        this.api
          .HttpPostType(
            "Offlinequote/CompletedPayment?User_Id=" +
              this.api.GetUserData("Id") +
              "&User_Type=" +
              this.api.GetUserType(),
            formData
          )
          .then(
            (result) => {
              this.api.HideLoading();
              if (result["status"] == true) {
                this.GetRow();
              } else {
                const msg = "msg";
                this.api.Toast("Warning", result["msg"]);
              }
            },
            (err) => {
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
  }

  CreateAnSr(type: any) {
    const formData = new FormData();
    formData.append("Quotation", this.Quotation_Id);
    formData.append("Sr_Type", type);

    if (confirm("Are you sure !") == true) {
      this.api.IsLoading();

      formData.append("Source", "CRM");
      // this.api.HttpPostType("OfflineQuoteSR", formData).then(
      this.api
        .HttpPostTypeBms("../v2/sr/OfflineQuoteSR/SubmitSr", formData)
        .then(
          (result: any) => {
            this.api.HideLoading();
            if (result["status"] == true) {
              window.open(result["SrUrl"], "", "fullscreen=yes");
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
    }
  }

  RejectedQuote() {
    if (confirm("Are you sure !") == true) {
      this.api.IsLoading(); //TypeArray
      this.api
        .HttpGetType(
          "Offlinequote/RejectedQuote?User_Id=" +
            this.api.GetUserData("Id") +
            "&User_Type=" +
            this.api.GetUserType() +
            "&Quotation=" +
            this.Quotation_Id
        )
        .then(
          (result) => {
            this.api.HideLoading();
            if (result["status"] == true) {
              this.GetRow();
            } else {
              const msg = "msg";
              this.api.Toast("Warning", result["msg"]);
            }
          },
          (err) => {
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

  RejectedQuoteModel(QUOTE: any) {
    const dialogRef = this.dialog.open(RejectquoteComponent, {
      width: "45%",
      height: "45%",
      disableClose: true,
      data: { Id: QUOTE },
    });

    dialogRef.afterClosed().subscribe((result: any) => {});
  }

  GetMessages() {
    // alert();
    //this.api.IsLoading();
    //   //   //   console.log(this.row);
    //   //   //   console.log(this.row.Id);
    this.api
      .HttpGetType(
        "Chat/Messages?Type=OfflineQuote&User_Id=" +
          this.api.GetUserData("Id") +
          "&Reference_Id=" +
          this.row.Id
      )
      .then(
        (result) => {
          //this.api.HideLoading();
          if (result["status"] == 1) {
            //this.api.Toast('Success',result['msg']);
            this.Messages = result["Messages"];
            this.scrollToBottom();
          } else {
            //alert(result['message']);
            //this.api.Toast('Warning',result['msg']);
          }
        },
        (err) => {
          // Error log
          ////   //   console.log(err);
          this.api.HideLoading();
          this.api.Toast(
            "Warning",
            "Network Error : " + err.name + "(" + err.statusText + ")"
          );
          //this.api.ErrorMsg('Network Error :- ' + err.message);
        }
      );
  }

  GetPunchingTeam() {
    this.api
      .HttpGetType(
        "Offlinequote/GetPunchingTeam?User_Id=" +
          this.api.GetUserData("Id") +
          "&User_Type=" +
          this.api.GetUserType() +
          "&Quotation=" +
          this.Quotation_Id
      )
      .then(
        (result) => {
          //this.api.HideLoading();
          if (result["Status"] == true) {
            //this.api.Toast('Success',result['msg']);
            this.GetPunchingTeamEmployee = result["Data"];
          } else {
            //alert(result['message']);
            //this.api.Toast('Warning',result['msg']);
          }
        },
        (err) => {
          // Error log
          ////   //   console.log(err);
          this.api.HideLoading();
          this.api.Toast(
            "Warning",
            "Network Error : " + err.name + "(" + err.statusText + ")"
          );
          //this.api.ErrorMsg('Network Error :- ' + err.message);
        }
      );
  }

  SharePunchingTeam() {
    this.isSubmitted = true;
    var fields = this.ShareToPunchingTeam.value;
    const formData = new FormData();

    if (this.ShareToPunchingTeam.invalid) {
      return;
    } else {
      if (confirm("Are you sure !") == true) {
        formData.append("Quotation", this.Quotation_Id);
        formData.append("PunchingEmployee", fields["PunchingTeam"][0]["Id"]);

        this.api.IsLoading(); //TypeArray
        this.api
          .HttpPostType(
            "Offlinequote/AssignPunchingEmployee?User_Id=" +
              this.api.GetUserData("Id") +
              "&User_Type=" +
              this.api.GetUserType(),
            formData
          )
          .then(
            (result) => {
              this.api.HideLoading();
              if (result["status"] == true) {
                this.GetRow();
              } else {
                const msg = "msg";
                this.api.Toast("Warning", result["msg"]);
              }
            },
            (err) => {
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
  }

  ViewOfflineQuoteDetailsPaymentConfrim(Id: any, type: any, Quotationid: any) {
    const dialogRef = this.dialog.open(ConfrimPaymentMethodComponent, {
      width: "30%",
      height: "30%",
      disableClose: true,
      data: { Id: Id, type: type, Quotation: this.Quotation_Id },
    });

    dialogRef.afterClosed().subscribe((result: any) => {});
  }

  InspectionDetails(id: any) {
    const dialogConfig = this.dialog.open(ViewDetailsModalComponent, {
      width: "90%",
      height: "90%",
      data: { sid: id },
    });

    dialogConfig.afterClosed().subscribe((result: any) => {
      //   //   //   console.log(result);
    });
  }

  SrPopup(type, row_Id): void {
    const formData = new FormData();
    formData.append("User_Id", this.api.GetUserData("Code"));
    formData.append("Source", "CRM");

    this.api
      .HttpPostTypeBms("../v2/sr/life/LifeSubmit/GetUserId", formData)
      .then(
        (result: any) => {
          if (result["Status"] == true) {
            var baseurl = "https://crm.squareinsurance.in/";
            var url =
              baseurl +
              "business-login/form/general-insurance/" +
              type +
              "/crm/" +
              result["User_Id"] +
              "/" +
              row_Id +
              "/web";
            window.open(url, "", "fullscreen=yes");
          } else {
            this.api.Toast("Error", result["Message"]);
          }
        },
        (err) => {
          this.api.Toast(
            "Warning",
            "Network Error, Please try again! " + err.message
          );
        }
      );
  }
}
