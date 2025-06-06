import { RightsFormPopupComponent } from "../rights-form-popup/rights-form-popup.component";
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
} from "@angular/forms";
import { Component, OnInit, ViewChild } from "@angular/core";
import { ApiService } from "../../providers/api.service";
import { Router, ActivatedRoute } from "@angular/router";
import { environment } from "../../../environments/environment";
import { HttpClient, HttpResponse, HttpHeaders } from "@angular/common/http";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { DataTableDirective } from "angular-datatables";

class ColumnsObj {
  SrNo: string;
  Id: string;
  contacttype: string;
  name: string;
  email: string;
  mobile: string;
  remark: string;
  date: string;
  Status: string;
  delete_status: string;
  url: any;
  status: any;
  add_stamp: any;
  parent_id: any;
  manager_rights: any;
  type: any;
  rights_management: any;
}

class DataTablesResponse {
  data: any[];
  draw: number;
  recordsFiltered: number;
  recordsTotal: number;
  TotalFiles: number;
}

@Component({
  selector: "app-rights-view",
  templateUrl: "./rights-view.component.html",
  styleUrls: ["./rights-view.component.css"],
})
export class RightsViewComponent implements OnInit {
  @ViewChild(DataTableDirective, { static: false })
  datatableElement: DataTableDirective;

  dtOptions: DataTables.Settings = {};
  dataAr: ColumnsObj[];
  loadAPI: Promise<any>;
  dtElements: any;
  SearchForm: FormGroup;
  isSubmitted = false;
  Is_Export: number;
  AddRights = "";
  rightsRoute = "";
  rightsicon = "";
  SetRightsId: any;
  constructor(
    private api: ApiService,
    private router: Router,
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.Get();
  }

  ClearSearch() {
    this.SearchForm.reset();
    this.Is_Export = 0;
  }

  Reload() {
    this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
      const pageinfo = dtInstance.page.info().page;
      //dtInstance.draw();
      dtInstance.page(pageinfo).draw(false);
    });
  }
  ResetDT() {
    this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.search("").column(0).search("").draw();
    });
  }

  //===== SEARCH DATATABLE DATA =====//

  SearchData(event: any) {
    this.Is_Export = 0;
    this.dataAr = [];

    this.datatableElement.dtInstance.then((dtInstance: any) => {
      const TablesNumber = `${dtInstance.table().node().id}`;

      if (TablesNumber == "Table1") {
        dtInstance.column(0).search(this.api.encryptText(JSON.stringify(event))).draw();
      }
    });
  }

  Get() {
    const httpOptions = {
      headers: new HttpHeaders({
        Authorization: "Bearer " + this.api.GetToken(),
      }),
    };
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      serverSide: true,
      processing: true,
      dom: "ilpftripl",
      ajax: (dataTablesParameters: any, callback) => {
        this.http
          .post<DataTablesResponse>(
            this.api.additionParmsEnc(environment.apiUrl +
              "/Rights_management/MyContactFetch?User_Id=" +
              this.api.GetUserData("Id") +
              "&User_Type=" +
              this.api.GetUserType()),

            dataTablesParameters,
            httpOptions
          )
          .subscribe((res:any) => {
    var resp = JSON.parse(this.api.decryptText(res.response));
            this.dataAr = resp.data;
            callback({
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: [],
            });
          });
      },
    };
  }

  AddContacts(type: any) {
    const dialogRef = this.dialog.open(RightsFormPopupComponent, {
      width: "50%",
      height: "50%",
      disableClose: true,
      data: { page_type: type },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.Get();
      this.ResetDT();
    });
  }

  onSubmitRights() {
    if (this.AddRights != "") {
      const formData = new FormData();
      formData.append("AddRights", this.AddRights);
      formData.append("rightsRoute", this.rightsRoute);
      formData.append("rightsicon", this.rightsicon);
      formData.append("RightsId", this.SetRightsId);
      this.api.IsLoading();

      this.api
        .HttpPostType("Rights_management/user_right_checkValue", formData)
        .then(
          (result: any) => {
            this.api.HideLoading();
            if (result["success"] == true) {
              const closebutton = document.getElementById("closemodal");
              closebutton.click();
              this.api.Toast("Success", result["message"]);
            } else {
              this.api.Toast("Warning", result["message"]);
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
  AddUserRights(data) {
    this.SetRightsId = data;
  }
}
