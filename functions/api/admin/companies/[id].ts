import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
};

// PUT /api/admin/companies/:id - Update company
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  if (!id || id === 'companies') {
    return new Response(JSON.stringify({ error: 'No company ID provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const body: any = await context.request.json();
    const name = body.name?.trim();

    if (!name) {
      return new Response(JSON.stringify({ error: 'Company name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // ✅ Update company with all new fields
    await DB.prepare(`
      UPDATE companies SET
        name = ?,
        logo_url = ?,
        website = ?,
        description = ?,
        street_address = ?,
        area = ?,
        locality = ?,
        district = ?,
        postal_code = ?,
        postal_area = ?,
        country = ?,
        industry = ?,
        founded_year = ?,
        employee_count = ?
      WHERE id = ?
    `).bind(
      name,
      body.logoUrl || '',
      body.url || '',
      body.description || '',
      body.streetAddress || '',
      body.area || '',
      body.locality || '',
      body.district || '',
      body.postalCode || '',
      body.postalArea || '',
      body.country || 'TZ',
      body.industry || '',
      body.foundedYear || '',
      body.employeeCount || '',
      id
    ).run();

    return new Response(JSON.stringify({
      id,
      name,
      logoUrl: body.logoUrl || '',
      url: body.url || '',
      description: body.description || '',
      streetAddress: body.streetAddress || '',
      area: body.area || '',
      locality: body.locality || '',
      district: body.district || '',
      postalCode: body.postalCode || '',
      postalArea: body.postalArea || '',
      country: body.country || 'TZ',
      industry: body.industry || '',
      foundedYear: body.foundedYear || '',
      employeeCount: body.employeeCount || ''
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    console.error('Company update error:', err);
    return new Response(JSON.stringify({ 
      error: 'Failed to update company',
      details: err instanceof Error ? err.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

// DELETE /api/admin/companies/:id - Delete company
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { DB } = context.env;
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  if (!id || id === 'companies') {
    return new Response(JSON.stringify({ error: 'No company ID provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    // ✅ Check for associated jobs before deleting
    const jobsResult = await DB.prepare(
      'SELECT COUNT(*) as count FROM jobs WHERE company_id = ?'
    ).bind(id).first();

    if (jobsResult && (jobsResult as any).count > 0) {
      return new Response(JSON.stringify({ 
        error: 'Cannot delete company with existing jobs',
        details: `This company has ${(jobsResult as any).count} job(s) associated with it. Delete or reassign the jobs first.`
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // ✅ Delete company
    await DB.prepare('DELETE FROM companies WHERE id = ?').bind(id).run();
    
    return new Response(JSON.stringify({ 
      success: true, 
      deleted: id,
      message: 'Company deleted successfully'
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    console.error('Company delete error:', err);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete company',
      details: err instanceof Error ? err.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
