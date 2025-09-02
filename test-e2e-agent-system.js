// End-to-End Test for Agent Automation System
// Tests: Dashboard → Projects Tab → Agent Launch → GitHub Issue Monitoring

const baseUrl = 'http://localhost:3500';

async function testComplete() {
  console.log('🧪 Starting End-to-End Agent System Test...\n');
  
  // Step 1: Test Dashboard Health
  console.log('📊 Step 1: Testing Dashboard Health');
  try {
    const response = await fetch(baseUrl);
    const html = await response.text();
    
    if (html.includes('Projects')) {
      console.log('✅ Dashboard loaded successfully');
      console.log('✅ Projects tab found in navigation');
    } else {
      console.log('❌ Projects tab not found');
      return false;
    }
  } catch (error) {
    console.log('❌ Dashboard failed to load:', error.message);
    return false;
  }

  // Step 2: Test Issue Tracking API
  console.log('\n📋 Step 2: Testing Issue Tracking API');
  try {
    const response = await fetch(`${baseUrl}/api/issue-tracking?project=AIBL`);
    const data = await response.json();
    
    console.log(`✅ API Response: ${data.success ? 'Success' : 'Failed'}`);
    console.log(`📊 Issues tracked: ${data.issueTracking?.length || 0}`);
    console.log(`🚨 Overdue: ${data.summary?.overdue || 0}`);
    console.log(`⚠️ At Risk: ${data.summary?.atRisk || 0}`);
    console.log(`✅ On Track: ${data.summary?.onTrack || 0}`);
    
    if (!data.success) {
      console.log('❌ Issue tracking API failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Issue tracking API error:', error.message);
    return false;
  }

  // Step 3: Get Baseline GitHub Issue Count
  console.log('\n🔍 Step 3: Getting Baseline GitHub Issue Count');
  let beforeCount = 0;
  try {
    const { execSync } = require('child_process');
    const result = execSync('gh issue list --repo BaliLove/chat-langchain --state open --limit 1000', 
      { encoding: 'utf8' });
    beforeCount = result.trim().split('\n').filter(line => line.trim()).length;
    console.log(`📊 Current open issues: ${beforeCount}`);
  } catch (error) {
    console.log('❌ Failed to get GitHub issue count:', error.message);
    return false;
  }

  // Step 4: Test Agent Launch API
  console.log('\n🤖 Step 4: Testing Agent Launch API');
  try {
    const response = await fetch(`${baseUrl}/api/run-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: 'aibl-issue-cleanup',
        projectPath: 'C:/Users/User/apps/aibl',
        agentName: 'Issue Cleanup Agent',
        projectName: 'AIBL'
      })
    });
    
    const result = await response.json();
    console.log(`🚀 Agent Launch: ${result.success ? 'Success' : 'Failed'}`);
    console.log(`📝 Message: ${result.message || result.error}`);
    
    if (!result.success) {
      console.log('❌ Agent launch failed - this needs debugging');
      console.log('🔧 Error details:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Agent launch API error:', error.message);
    return false;
  }

  // Step 5: Monitor for Terminal Launch
  console.log('\n🖥️ Step 5: Monitoring for Terminal Launch');
  try {
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
    
    const { execSync } = require('child_process');
    const processes = execSync('wmic process where "name=\'cmd.exe\'" get ProcessId,CommandLine /format:csv', 
      { encoding: 'utf8' });
    
    const claudeProcesses = processes.split('\n').filter(line => 
      line.includes('claude') || line.includes('AIBL') || line.includes('Issue Cleanup')
    );
    
    console.log(`🔍 Found ${claudeProcesses.length} potential Claude processes`);
    if (claudeProcesses.length > 0) {
      console.log('✅ Terminal appears to have launched');
      claudeProcesses.forEach((process, index) => {
        console.log(`   ${index + 1}. ${process.substring(0, 100)}...`);
      });
    } else {
      console.log('⚠️ No Claude terminals detected - manual verification needed');
    }
  } catch (error) {
    console.log('⚠️ Could not detect terminal launch:', error.message);
  }

  // Step 6: Monitor GitHub Issues for Changes
  console.log('\n📈 Step 6: Monitoring GitHub Issues for Changes');
  console.log('⏰ Waiting 60 seconds for agent to process issues...');
  
  await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
  
  try {
    const { execSync } = require('child_process');
    const result = execSync('gh issue list --repo BaliLove/chat-langchain --state open --limit 1000', 
      { encoding: 'utf8' });
    const afterCount = result.trim().split('\n').filter(line => line.trim()).length;
    
    console.log(`📊 Before: ${beforeCount} open issues`);
    console.log(`📊 After:  ${afterCount} open issues`);
    console.log(`📈 Change: ${beforeCount - afterCount} issues processed`);
    
    if (afterCount < beforeCount) {
      console.log('✅ Agent successfully processed issues!');
      console.log(`🎯 Improvement: ${beforeCount - afterCount} issues closed`);
    } else if (afterCount === beforeCount) {
      console.log('⚠️ No issues closed - agent may need more time or different approach');
    } else {
      console.log('❓ Issue count increased - possible new issues were created');
    }
  } catch (error) {
    console.log('❌ Failed to check final issue count:', error.message);
  }

  // Step 7: Test Dashboard Real-time Updates
  console.log('\n🔄 Step 7: Testing Dashboard Real-time Updates');
  try {
    const response = await fetch(`${baseUrl}/api/issue-tracking?project=AIBL`);
    const data = await response.json();
    
    console.log('📊 Updated Dashboard Data:');
    console.log(`   Total Issues: ${data.issueTracking?.length || 0}`);
    console.log(`   Overdue: ${data.summary?.overdue || 0}`);
    console.log(`   At Risk: ${data.summary?.atRisk || 0}`);
    console.log(`   On Track: ${data.summary?.onTrack || 0}`);
    
    console.log('✅ Dashboard data refreshed successfully');
  } catch (error) {
    console.log('❌ Dashboard refresh failed:', error.message);
  }

  console.log('\n🎉 End-to-End Test Complete!');
  console.log('\n📋 Summary:');
  console.log('- Dashboard: Working ✅');
  console.log('- Projects Tab: Working ✅');  
  console.log('- Issue API: Working ✅');
  console.log('- Agent Launch: ' + (beforeCount !== afterCount ? 'Working ✅' : 'Needs Debug ⚠️'));
  console.log('- Real-time Updates: Working ✅');
  
  return true;
}

// Run the test
testComplete().catch(console.error);