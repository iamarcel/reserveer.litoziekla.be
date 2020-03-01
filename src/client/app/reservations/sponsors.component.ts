import { Component, ViewChild, OnInit } from "@angular/core";

import { Observable, interval } from "rxjs";
import { DragScrollComponent } from "ngx-drag-scroll";

import { Opportunity } from "../../../models/opportunity";
import { CampaignService } from "./campaign.service";

@Component({
  selector: "sponsors",
  templateUrl: "./sponsors.component.html",
  styleUrls: ["./sponsors.component.scss"]
})
export class SponsorsComponent implements OnInit {
  @ViewChild("sponsorNav", {
    read: DragScrollComponent
  })
  ds: DragScrollComponent;

  sponsors: Opportunity[];
  paragraphRegex = /<\/?p>/gi;

  constructor(private campaignService: CampaignService) {
    campaignService.getSponsors().subscribe(sponsors => {
      this.sponsors = sponsors;
    }, console.error);
  }

  ngOnInit() {
    interval(3000).subscribe(_ => {
      if (!this.sponsors) {
        return;
      }

      // Width of an item is 28%, so the current index is the one but last item
      if (this.ds.currIndex >= this.sponsors.length - 3) {
        this.ds.moveTo(0);
      } else {
        this.ds.moveRight();
      }
    });
  }
}
