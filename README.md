## Team Name: The Crafty Cows

### Tool Name: Downer Cow Risk Rating

### Use Case
Downer Cow Syndrome refers to a cow which cannot stand of own accord, owing to disease, trauma or other external factor. It is possible to calculate a paddock's risk of having cows develop downer syndrome based on soil parameters and hours of cloud cover. A paddock can be rated as being at high, medium or low of having animals develop the disability.

### Delivery Method
The risk rating will be delivered as a colour overlay to satellite map imagery, which includes paddock delineation. The following colours will be used to denote the risk rating:

* RED for a HIGH rating
* ORANGE for a MEDIUM rating
* GREEEN for a LOW rating

### FarmBuild Components Used
TBA

### Benefits
The visualisation of a risk rating based on paddocks allows landowners to take preventative measures, such as moving herds to lower risked paddocks, potentially avoiding the onset of the syndrome.

###Inputs
The risk rating takes in two soil parameters and one climate parameter as follows:

* Phosphorus Buffer Index (PBI)
* Potassium (Colwell)
* Daily Cloudiness rated as HIGH, MEDIUM or LOW

###Outputs
There a single output, being a numerical risk rating for downer cow syndrome as follows:

* 1 for a LOW risk rating
* 2 for a MEDIUM risk rating
* 3 for a HIGH risk rating

###Processing Required
Requires the integration of soil sample data and climate (cloudiness) measurements. The two data sets are then used to calculate the risk rating based on the following algorithm:

```javascript

SRR => Soil Risk Rating
CRR => Cloud Risk Rating
Coll_K => Potassium (Colwell)
PBI => Phosphorus Buffer Index
HIGH = 3
MED = 2
LOW = 1

//PBI Above 250
if PBI <= 250 {

	if Coll_K < 200 {}
		SRR = 1
  }

	else if Coll_K >200 && < 450 {
    SRR = 2
  }

	else {
	  // Coll_K > 450
		SRR = 3
  }

}

// PBI Between 200 and 400
else if PBI > 200 && <= 400

  if Coll_K < 250 {}
    SRR = 1
  }

  else if Coll_K >250 && < 450 {
    SRR = 2
  }

  else {
    // Coll_K > 450
    SRR = 3
    }
}

//PBI Greater Than 400
else {

  if Coll_K < 300 {}
    SRR = 1
    }

  else if Coll_K > 300 && < 500 {
    SRR = 2
  }

  else {
    // Coll_K > 500
    SRR = 3
  }
}

import CRR

RR_sum =  SRR + CRR

if RR_sum == 2
  RR = 1 // LOW Risk Rating

if RR_sum == 3 || RR_sum == 4
  RR = 2 // MEDIUM Risk Rating

if RR_sum == 5 || RR_sum == 6
  RR = 3 // HIGH Risk Rating

return RR
