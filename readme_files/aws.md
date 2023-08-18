### Set Up an AWS EC2 Instance for framing
This section details general AWS EC2 setup and then redirects to page for installing framing on an AWS EC2 instance.
#### AWS Account

 - Follow [these instructions](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/get-set-up-for-amazon-ec2.html) (outlined below). 
	 - [Set up a root user account](https://portal.aws.amazon.com/billing/signup) on AWS. 
		 - Sign in to the [AWS Management Console](https://console.aws.amazon.com/) as the account owner by choosing 'Root user' and entering your AWS account email address.
	 - **Recommended but optional:** Create a user to be the administrator of the EC2 instance with [this guide](https://docs.aws.amazon.com/singlesignon/latest/userguide/getting-started.html). 
	 - Create a key pair (security credentials).
	 - Create a security group.
		 - In addition to the Amazon tutorial instructions for creating a security group, be sure to allow all TCP ports (0 - 65535) in the inbound rules to allow ZeroMQ (the software that connects the Python and JavaScript) to function. The outbound rule should allow all traffic on all protocols and all ports (as is set by default).
#### Set up an EC2 instance
Refer to [these Amazon instructions](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html) for additional help.
- From [the EC2 dashboard](https://console.aws.amazon.com/ec2/), in the top right choose 'Launch Instances'.
- In the box under 'Name and tags', give your server a name.
- Refer to the 'Application and OS Images (Amazon Machine Image)' dropdown box. Under 'Quick Start' choose 'Ubuntu'.
- Scroll down to the next dropdown box 'Instance Type'.
    - Consult [a comparison table like this](https://instances.vantage.sh/) to determine how much horsepower (and corresponding hourly cost) you want. To date, the algorithm has been hosted with t2.medium.
    - Select your choice from the dropdown box under 'Instance Type'.
- Scroll down to the 'Key pair (login)' dropdown box.
    - If you haven't yet created a key pair, do so now.
        - Select 'Create new key pair'
        - In the topmost box of the pop-up, enter a name for the key pair (e.g. something like the name of the server.) Do not use spaces.
        - Leave the other default settings and, in the bottom right, choose 'Create key pair'.
        - Take note of where the file downloads to. We will need to know the directory so we can copy this key file into another location later.
    - Otherwise, choose a pre-existing key pair to associate with the new EC2 instance from the drop-down box.
- Scroll down to the 'Network settings' dropdown box.
    - Refer to the options under 'Firewall (security groups)'.
    - If you haven't yet created a security group, leave the default settings ('Create security group' box checked) and edit the security group later. 
    - Otherwise, check the 'Select existing security group' box and then select the security group you made earlier from the drop-down.
- Scroll down to the 'Configure storage' dropdown box.
    - **IMPORTANT:** Change the leftmost box (for GiB) from '8' to '30'. 30 GiB is the max you can get without incurring extra charges. The default, 8 GiB, is too little.
- **Optional:** If you created an IAM profile earlier you can specify it in the second drop-down under 'Advanced details'.
- Leave all other default settings
- On the bottom right, click 'Launch Instance'.
- Click on the left sidebar. Scroll down to 'Network & Security'.
- If you have not already made a special security group for your EC2 instance (rather than the default that is made in the launch wizard), select 'Security Groups'.
    - On the lefthand side of the page, select the checkbox for your security group (probably called 'launch-wizard-1').
    - In the top center of the page, select 'Actions' and then select 'Edit inbound rules'.
    - In the bottom left, select 'Add rule'.
        - In the leftmost dropdown, select 'All TCP'.
        - Following this row to the dropdown with the magnifying glass icon, select '0.0.0.0/0'.
    - In the bottom left, select 'Add rule' again.
        - In the leftmost dropdown, select 'HTTP'.
        - Following this row to the dropdown with the magnifying glass icon, select '0.0.0.0/0'.
    - In the bottom right, select 'Save rules'.
- In the left sidebar under 'Network & Security', select 'Elastic IPs'.
    - On the top right of the Elastic IPs page, select 'Allocate Elastic IP Address.'
    - Scroll to the bottom of the page and select 'Allocate' on the bottom right.
    - Select your new IP address by checking the box next to it.
    - In the top center of the page, select 'Actions' and then select 'Associate Elastic IP address'.
    - In the middle left of the page, under 'Instance', choose the name of the instance you launched from the dropdown.
    - On the bottom right, choose 'Associate'.
- From the left sidebar, choose 'Instances' under "Instances'.
- Click the checkbox next to your instance. Refer to the bottom left page under the tab 'Details'.
- Make a note of the IP address in the middle of the page under 'Public IPv4 address' for connecting to the instance. 
